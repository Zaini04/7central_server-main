const Payment = require('../../models/paymentModel');
const Installment = require('../../models/installmentModel');
const mongoose = require('mongoose');
const Sale = require('../../models/saleModel');
const AppError = require('../appError');
const Inventory = require('../../models/inventoryModel');
const { getNextInSequence } = require('../db');
const { getLongAutoIncrementId } = require('../helpers');
const { sendPaymentConfirmationNotification } = require('../reminders/paymentNotificationHelper');

    const popItems = [
        { path: 'sector', select: 'title' },
      ]
exports.submitSplitPayment = async ({ installmentId,inventoryId, parts, receiptNo, createdBy,files,notes="" }) => {
 
    let inst;
    let  inventory;

 
 if (!installmentId && inventoryId) {
     inventory = await Inventory.findById(inventoryId).populate(popItems);
    if (!inventory) throw new AppError('Inventory not found');

    const sale = await Sale.findById(inventory.currentSale);
    if (!sale) throw new AppError('No active sale found for this inventory',404);

    inst = await Installment.findOne({
      sale: sale._id,
      status: { $in: ['un-paid', 'overdue','pertially_paid','defaulted'] }
    }).sort({ dueDate: 1 }); // oldest due first

    if (!inst) throw new AppError('No unpaid installments found for this inventory',404);
  } 
  // B) If specific installmentId given → normal path
  else if (installmentId) {
    inst = await Installment.findById(installmentId);
    console.log('Found installment:', inst);
    if (!inst) throw new AppError('Installment not found',404);
     inventory = await Inventory.findById(inst.inventory).populate(popItems);
  } else {
    throw new AppError('Either installmentId or inventoryId is required',404);
  }

  const normalized = parts.map(p => ({
    method: p.method,
    amount: Number(p.amount),
    paidAt: p.paidAt ? new Date(p.paidAt) : new Date(),
    reference: p.reference, chequeNo: p.chequeNo, payOrderNo: p.payOrderNo,
    description: p.description,
    files: Array.isArray(p.files) ? p.files : []
  }));
  const total = normalized.reduce((s,x)=>s+(x.amount||0),0);
  if (total <= 0) throw new AppError('Total amount must be > 0');

  const paidAt = normalized.map(x=>x.paidAt).sort((a,b)=>a-b)[0];
  const newIDNumber = await getNextInSequence("payments");
  const longAutoIncrementId = getLongAutoIncrementId(
    `PR-${inventory?.sector?.title}`,
    newIDNumber
  );
 
  const payment = await Payment.create({
    autoIncrementId: newIDNumber,
    longAutoIncrementId: longAutoIncrementId,
    sale: inst.sale,
    installment: inst._id,
    inventory: inst.inventory,
    totalAmount: total,
    parts: normalized,
    paidAt,
    receiptNo: receiptNo || longAutoIncrementId,
    createdBy,
    status: 'pending',
    files,
    notes
  });

  return payment;
};

async function allocatePaymentAcrossInstallments({ saleId, totalAmount, }) {
  let remaining = totalAmount;

  // Get all unpaid installments in dueDate order
  const installments = await Installment.find({
    sale: saleId,
    status: { $in: ['un-paid', 'overdue','pertially_paid','defaulted'] }
  })
  .sort({ dueDate: 1 });
  // .session(session);

  for (const inst of installments) {
    if (remaining <= 0) break;

    const alreadyPaid = inst.paidAmount || 0;
    const dueRemaining = inst.amount - alreadyPaid;

    if (dueRemaining <= 0) continue; // already fully covered by other payments

    const applied = Math.min(remaining, dueRemaining);
    inst.paidAmount = alreadyPaid + applied;

    if (inst.paidAmount >= inst.amount) {
      inst.status = 'paid';
      inst.paidAt = new Date();
    }
    await inst.save();

    remaining -= applied;
  }

  return remaining; // anything >0 is true overpayment
}

exports.verifyPayment = async ({ paymentId, approve, notes, adminId }) => {


  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new AppError('Payment not found',403);
    if (payment.status !== 'pending') throw new AppError('Only pending payments can be verified',403);

    // Reject case: no ledger changes
    if (!approve) {
      payment.status = 'rejected';
      payment.verifyNotes = notes;
      payment.verifiedBy = adminId;
      payment.verifiedAt = new Date();
      await payment.save();
      // await session.commitTransaction();
      return payment;
    }

    // APPROVAL: distribute across installments of this sale
    const saleId = payment.sale;
    if (!saleId) throw new AppError('Payment has no sale attached',403);

    const remaining = await allocatePaymentAcrossInstallments({
      saleId,
      totalAmount: payment.totalAmount,
      
    });

    // (optional) TODO: if remaining > 0, create a CreditNote record here.

    // If all installments are now paid, complete the sale & inventory
    const unpaidCount = await Installment.countDocuments({
      sale: saleId,
      status: { $in: ['un-paid', 'overdue','pertially_paid','defaulted'] }
    });

    if (unpaidCount === 0) {

      const sale = await Sale.findById(saleId).populate('inventory');
      if(sale.status === 'active'){
      sale.status = 'completed';
      await sale.save();
      if (sale.inventory) {
        sale.inventory.status = 'full_paid';
        await sale.inventory.save();
      }
      }
     
    }

    payment.status = 'approved';
    payment.verifyNotes = notes;
    payment.verifiedBy = adminId;
    payment.verifiedAt = new Date();
    await payment.save();
    if(payment.status == 'approved'){
      await sendPaymentConfirmationNotification({
        paymentId: payment._id,
      });
    }

    // await session.commitTransaction();
    return payment;
  } catch (e) {
    // await session.abortTransaction();
    throw e;
  } finally {
    // session.endSession();
  }
};