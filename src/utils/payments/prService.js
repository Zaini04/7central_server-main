const ProvisionalReceipt = require('../../models/provisionalReceiptModel');
const Inventory = require('../../models/inventoryModel');
const Sale = require('../../models/saleModel');
const Payment = require('../../models/paymentModel');
const Installment = require('../../models/installmentModel');
const AppError = require('../appError');
const { getNextInSequence } = require('../db');
const { getLongAutoIncrementId } = require('../helpers');

    const popItems = [
        { path: 'sector', select: 'title' },
      ]
exports.createPR = async ({
  inventoryId,
  bankName,
  chequeNo,
  chequeDate,
  amount,
  notes,
  files,
  createdBy
}) => {

  const inv = await Inventory.findById(inventoryId).populate('currentSale');
  if (!inv) throw new AppError('Inventory not found');

  const sale = inv.currentSale;
  if (!sale) throw new AppError('This inventory has no active sale');

  const buyers = sale.buyers;

  const pr = await ProvisionalReceipt.create({
    inventory: inventoryId,
    sale: sale._id,
    buyers,
    bankName,
    chequeNo,
    chequeDate,
    amount,
    notes,
    files,
    createdBy,
    status: 'pending_clearance'
  });

  return pr;
};

exports.markPRBounced = async ({ prId, reason, files, userId }) => {
  const pr = await ProvisionalReceipt.findById(prId);
  if (!pr) throw new AppError('Provisional receipt not found');

  if (pr.status === 'cleared')
    throw new AppError('Cannot bounce a cleared PR');

  pr.status = 'bounced';
  pr.notes = reason || pr.notes;
  pr.updatedBy = userId;
  pr.bouncedAt = new Date();

  if (files && files.length > 0) {
    pr.files = [...pr.files, ...files];
  }

  await pr.save();
  return pr;
};


exports.clearPR = async ({ prId, userId }) => {
  const pr = await ProvisionalReceipt.findById(prId).populate('inventory sale');
  if (!pr) throw new AppError('PR not found');

  if (pr.status !== 'pending_clearance')
    throw new AppError('Only pending PR can be cleared');

  const saleId = pr.sale._id;

  // Find target installment
  const inst = await Installment.findOne({
    sale: saleId,
    status: { $in: ['un-paid', 'overdue','pertially_paid','defaulted'] }
  }).sort({ dueDate: 1 });

  if (!inst) throw new AppError('No unpaid installments for this sale');

  // Build Payment.parts record
  const paymentParts = [{
    method: 'cheque',
    amount: pr.amount,
    paidAt: pr.chequeDate,
    chequeNo: pr.chequeNo,
    description: `Cheque from PR ${pr._id}`,
    files: pr.files
  }];

     let  inventory = await Inventory.findById(inst.inventory).populate(popItems);

       const newIDNumber = await getNextInSequence("payments");
  const longAutoIncrementId = getLongAutoIncrementId(
    `PR-${inventory?.sector?.title}`,
    newIDNumber
  );
  // Create Payment (status = pending)
  const payment = await Payment.create({
    autoIncrementId: newIDNumber,
    longAutoIncrementId: longAutoIncrementId,
    sale: saleId,
    installment: inst._id,
    inventory:inst.inventory,
    totalAmount: pr.amount,
    parts: paymentParts,
    paidAt: pr.chequeDate,
    receiptNo: longAutoIncrementId,       // OR you can generate one
    createdBy: userId,
    status: 'pending'
  });

  // Update PR status
  pr.status = 'cleared';
  pr.clearedAt = new Date();
  pr.updatedBy = userId;
  await pr.save();

  return payment;
};

