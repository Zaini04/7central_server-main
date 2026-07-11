
const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse, getLongAutoIncrementId, displayNameFromBuyers } = require("../utils/helpers");
const AppError = require("../utils/appError");
const logger = require('../logger')('INVENTORY_CONTROLLER');
const Inventory = require("../models/inventoryModel");
const Sale = require("../models/saleModel");
const OwnerShipHistory = require("../models/ownershipHistoryModel");
const { saleValidationSchema } = require("../validations/saleValidation");
const { installmentPlanSchema } = require("../validations/installmentPlanValidation");
const dayjs = require('dayjs');
const InstallmentPlan = require("../models/installmentPlanModel");
const Installment = require("../models/installmentModel");
const handlerFactory = require('./factories/handlerFactory');
const Customer = require("../models/customerModel");
const { buildInstallmentRows, applyPaidAmountFIFO } = require("../utils/installmentPlanBuilder");
const { default: mongoose } = require("mongoose");



exports.createSale = catchAsync(async (req, res, next) => {
    const { error } = saleValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  const { inventory, buyers, sellingPrice, actualPrice,paymentType } = req.body;

  const checkInventory = await Inventory.findById(inventory);
  if (!checkInventory) return next(new AppError("Inventory not found", 404));

  if (checkInventory.status !== 'not_assigned') {
    return next(new AppError("This inventory not available for sale", 400));
  }
  const checkCustomers = await Customer.find({ _id: { $in: buyers } });
  if (checkCustomers.length !== buyers.length) {
    return next(new AppError("One or more buyers not found", 404));
  }

  const buyersDisplayName = displayNameFromBuyers(checkCustomers);
  const sale = await Sale.create({
    ...req.body,
    buyersDisplayName,
    status: 'draft',
    createdBy: req.user._id,
  });
  // Update inventory ownership
  checkInventory.actualPrice = actualPrice || null;
  checkInventory.currentSale = sale._id;
  checkInventory.status = 'assigned';
  await checkInventory.save();

  // Log ownership history
  await OwnerShipHistory.create({
     inventory,
     newSale: sale._id,
     newBuyers: buyers,
    remarks: "Initial purchase",
    createdBy: req.user._id,
  });

  sendSuccessResponse(res, 200, logger, {
    message: "Inventory assigned successfully.",
    doc:{inventory:checkInventory,sale}
  });
});
exports.changeInventoryOwnershipSale = catchAsync(async (req, res, next) => {
    const { error } = saleValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  const { inventory, buyers, sellingPrice, actualPrice,paymentType } = req.body;

  const checkInventory = await Inventory.findById(inventory);
  if (!checkInventory) return next(new AppError("Inventory not found", 404));

  if (checkInventory.status !== 'assigned') {
    return next(new AppError("This inventory not available for sale", 400));
  }
  let currentSale = await Sale.findById(checkInventory.currentSale);
  if(!currentSale){
    return next(new AppError("Current sale not found for this inventory", 404));
  }
  const checkCustomers = await Customer.find({ _id: { $in: buyers } });
  if (checkCustomers.length !== buyers.length) {
    return next(new AppError("One or more buyers not found", 404));
  }

  const buyersDisplayName = displayNameFromBuyers(checkCustomers);
  let sale = await Sale.create({
    ...req.body,
    buyersDisplayName,
    status: 'draft',
    createdBy: req.user._id,
    transferredFrom:currentSale._id,
    sellingPrice:sellingPrice || currentSale.sellingPrice,
    actualPrice:actualPrice || currentSale.actualPrice,
    plan:currentSale.plan,
  });
  // Update inventory ownership
  // checkInventory.actualPrice = actualPrice || null;
  checkInventory.currentSale = sale._id;
  checkInventory.status = 'assigned';
  await checkInventory.save();
  currentSale.status = 'transferred';
  currentSale.transferredTo = sale._id;
  await currentSale.save();


await Installment.updateMany(
  {
    sale: currentSale._id,
    status: { $in: ["un-paid", "overdue", "defaulted"] }
  },
  {
    sale: sale._id
  }
);
sale.status = 'active';
await sale.save();
  // Log ownership history
  await OwnerShipHistory.create({
     inventory,
     newSale: sale._id,
     newBuyers: buyers,
     previousBuyers: currentSale.buyers,
     oldSale: currentSale._id,
    remarks: "Ownership transfer",
    createdBy: req.user._id,
  });

  sendSuccessResponse(res, 200, logger, {
    message: "Inventory Ownership transfered successfully.",
    doc:{inventory:checkInventory,sale}
  });
});



exports.createPaymentPlan = catchAsync(async (req, res, next) => {
  const { value, error } = installmentPlanSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const sale = await Sale.findById(value.sale);
  if (!sale) throw new Error("Sale not found");

  if (value.totalScheduled == null) {
    value.totalScheduled = value._computedTotalScheduled;
  }
  if (value.fullPayment) {
    value.totalScheduled = value.fullPayment;
  }
  delete value._computedTotalScheduled;

  const plan = await InstallmentPlan.create(value);
  sale.plan = plan._id;
  await sale.save();

  const rows = [];
  const monthMap = new Map(); // "YYYY-MM" -> index in rows

  // const today = dayjs().startOf("day");
  const today = value.bookingDate
  ? dayjs(value.bookingDate).startOf("day")
  : dayjs().startOf("day");

  const monthKey = (d) => dayjs(d).format("YYYY-MM");

  // helper: schedule payment without overlapping month
  const push = (kind, dueDate, amount) => {
    if (!amount || amount <= 0 || !dueDate) return;

    let d = dayjs(dueDate).startOf("day");
    let safety = 0;

    // move forward month-by-month until a free month is found
    while (safety++ < 2400) {
      const key = monthKey(d);
      if (!monthMap.has(key)) {
        monthMap.set(key, rows.length);
        rows.push({
          plan: plan._id,
          sale: sale._id,
          inventory: sale.inventory,
          type: kind,
          dueDate: d.toDate(),
          amount,
          status: "un-paid",
          createdBy: req.user?._id,
        });
        return;
      }
      d = d.add(1, "month");
    }

    throw new Error("Could not schedule installment without overlap");
  };

  // ── 1) Milestones (highest priority) ──────────────────────────
  if (value.fullPayment) {
    push("full_payment", today.toDate(), value.fullPayment);
  }

  if (value.downPayment) {
    push("down_payment", today.toDate(), value.downPayment);
  }

  if (value.allocation) {
    push("allocation", today.add(30, "day").toDate(), value.allocation);
  }

  if (value.confirmation) {
    push("confirmation", today.add(60, "day").toDate(), value.confirmation);
  }

  // if (value.possession) {
  //   push("possession", today.add(36, "month").toDate(), value.possession);
  // }

  // NOTE:
  // We now push balloons BEFORE monthly so balloons keep their months
  // and monthly payments get shifted when there is a clash.
  // You can configure balloon.duration = 6 months for "Half Yearly" like in the sheet.

  // ── 2) Balloon / Half-yearly stream ──────────────────────────
  if (value.balloon?.count) {
    let d = value.balloon.startDate || today.add(6, "month").toDate();
    for (let i = 0; i < value.balloon.count; i++) {
      push("balloon", d, value.balloon.amount);
      d = addPeriod(d, value.balloon.duration); // e.g. 6 months
    }
  }

  if (value.monthlyBalloon?.count) {
    let d = value.monthlyBalloon.startDate || today.add(6, "month").toDate();
    for (let i = 0; i < value.monthlyBalloon.count; i++) {
      push("monthly_balloon", d, value.monthlyBalloon.amount);
      d = addPeriod(d, value.monthlyBalloon.duration); // e.g. 6 months
    }
  }

  // ── 3) Quarterly stream ──────────────────────────────────────
  if (value.quarterly?.count) {
    let d = value.quarterly.startDate || today.add(3, "month").toDate();
    for (let i = 0; i < value.quarterly.count; i++) {
      push("quarterly", d, value.quarterly.amount);
      d = addPeriod(d, value.quarterly.duration);
    }
  }

  // ── 4) Monthly stream (lowest priority, will shift the most) ─
  if (value.monthly?.count) {
    let d = value.monthly.startDate || today.add(1, "month").toDate();
    for (let i = 0; i < value.monthly.count; i++) {
      push("monthly", d, value.monthly.amount);
      d = addPeriod(d, value.monthly.duration);
    }
  }

  // ── 5) Possession (always last) ──────────────────────────
if (value.possession && rows.length > 0) {
  // find last due date
  const lastDate = rows.reduce((max, r) =>
    r.dueDate > max ? r.dueDate : max
  , rows[0].dueDate);

  // add 1 month after last installment
  const possessionDate = dayjs(lastDate)
    .add(1, "month")
    .startOf("day")
    .toDate();

  rows.push({
    plan: plan._id,
    sale: sale._id,
    inventory: sale.inventory,
    type: "possession",
    dueDate: possessionDate,
    amount: value.possession,
    status: "un-paid",
    createdBy: req.user?._id,
  });
}

  // ── Final clean-up: sort by date and assign seq ──────────────
  rows.sort((a, b) => a.dueDate - b.dueDate);

  let seq = 1;
  for (const r of rows) {
    r.seq = seq++;
  }

  
  const docs = await Installment.insertMany(rows);
  const total = docs.reduce((s, r) => s + r.amount, 0);

  sale.status = "active";
  await sale.save();

  // if you want plan.totalScheduled to be the sum of all rows, uncomment:
  // plan.totalScheduled = total;
  // await plan.save();

  sendSuccessResponse(res, 200, logger, {
    message: "Inventory Purchase plan created successfully.",
    plan,
    installments: docs,
    sale,
  });
});

exports.updatePaymentPlan = catchAsync(async (req, res, next) => {
  const { value, error } = installmentPlanSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 422));

  const sale = await Sale.findById(value.sale);
  if (!sale) return next(new AppError("Sale not found", 404));

  const existingPlan = await InstallmentPlan.findById(sale.plan);
  if (!existingPlan) return next(new AppError("Installment plan not found", 404));

  // normalize totals
  if (value.totalScheduled == null) value.totalScheduled = value._computedTotalScheduled;
  if (value.fullPayment) value.totalScheduled = value.fullPayment;
  delete value._computedTotalScheduled;

  const existingInstallments = await Installment.find({ plan: existingPlan._id })
    .sort({ seq: 1, dueDate: 1, createdAt: 1 });

  const paidInstallments = existingInstallments.filter(
    i => Number(i.paidAmount || 0) > 0 || i.status === "paid" || i.status === "partially-paid"
  );
  const unpaidInstallments = existingInstallments.filter(
    i => !(Number(i.paidAmount || 0) > 0 || i.status === "paid" || i.status === "partially-paid")
  );

  const totalPaidAlready = paidInstallments.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0), 0
  );

  const freshRows = buildInstallmentRows({ value, sale, planId: existingPlan._id, userId: req.user?._id });
  const totalNewSchedule = freshRows.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (totalPaidAlready > totalNewSchedule) {
    return next(new AppError(
      `Already paid (${totalPaidAlready}) exceeds new plan total (${totalNewSchedule}).`, 422
    ));
  }

  const projectedRows = applyPaidAmountFIFO(freshRows, totalPaidAlready);

  const outstandingRows = projectedRows
    .filter(row => (Number(row.amount || 0) - Number(row.paidAmount || 0)) > 0)
    .map(row => ({
      ...row,
      amount: Number(row.amount || 0) - Number(row.paidAmount || 0),
      paidAmount: 0, paidAt: null, paidBy: null, status: "un-paid",
    }));

  // Delete old unpaid installments
  if (unpaidInstallments.length) {
    await Installment.deleteMany({ _id: { $in: unpaidInstallments.map(i => i._id) } });
  }

  let seqStart = paidInstallments.length + 1;
  const newOutstandingDocs = outstandingRows.map(row => ({
    ...row,
    seq: seqStart++,
    plan: existingPlan._id,
    sale: sale._id,
    inventory: sale.inventory,
    createdBy: req.user?._id || null,
  }));

  let createdInstallments = [];
  if (newOutstandingDocs.length) {
    createdInstallments = await Installment.insertMany(newOutstandingDocs);
  }

  const updatedPlan = await InstallmentPlan.findByIdAndUpdate(
    existingPlan._id,
    { $set: { ...value, sale: sale._id, inventory: sale.inventory, totalScheduled: totalNewSchedule } },
    { new: true, runValidators: true }
  );

  sale.plan = updatedPlan._id;
  sale.status = "active";
  await sale.save();

  const finalInstallments = await Installment.find({ plan: updatedPlan._id }).sort({ seq: 1, dueDate: 1 });

  sendSuccessResponse(res, 200, logger, {
    message: "Payment plan updated successfully.",
    plan: updatedPlan, sale,
    alreadyPaidAmount: totalPaidAlready,
    totalScheduled: totalNewSchedule,
    outstandingAmount: totalNewSchedule - totalPaidAlready,
    installments: finalInstallments,
    createdOutstandingInstallments: createdInstallments,
  });
});


exports.getPaymentPlan = catchAsync(async (req, res, next) => {
    const { inventory } = req.query;
    const query = {};


    const checkInventory = Inventory.findById(inventory);
    if (!checkInventory) {
      return next(new AppError("Inventory not found.", 404));
    }
    

    // if(!checkInventory.currentSale){
    //   return next(new AppError("This inventory currently not purchased or not assigned.", 404));
    // }

    const currentSale = await Sale.findById(checkInventory.currentSale);
    query.sale = currentSale._id;

    if(!currentSale.plan){
      return next(new AppError("This inventory does not have any purchasing plan.", 404));
    }
    const allInstallments = await Installment.find(query).sort({seq:1});    


  
  sendSuccessResponse(res, 200, logger, {
    inventory: checkInventory, installments: allInstallments,
    sale: currentSale
  });
});
    const popItems = [
        { path: 'plan',  },
        { path: 'sale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
        { path: 'inventory', populate: [
          { path: 'project',select:'title -_id'},
          { path: 'sector',select:'title -_id'},
          { path: 'currentSale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
        ]  },
        {
        path : 'createdBy',
        select: 'username image email -_id'}
      ]
exports.getAllInstallments = catchAsync(async (req, res, next) => {

  const { inventory,type,status } = req.query;
    const query = {};

    if (inventory) {
      query.inventory = inventory;
    } else if (type) {
      query.type = type;
    }
    else if (status) {
      query.status = status;
    }


    handlerFactory.getAll(Installment, popItems, logger, query)(req, res, next)
});
exports.getAllInstallments = catchAsync(async (req, res, next) => {

  const { inventory,type,status } = req.query;
    const query = {};

    if (inventory) {
      query.inventory = inventory;
    } else if (type) {
      query.type = type;
    }
    else if (status) {
      query.status = status;
    }
    req.query.sort= "dueDate:asc";


    handlerFactory.getAll(Installment, popItems, logger, query)(req, res, next)
});

exports.getSingleInstallment = handlerFactory.getOne(Installment ,popItems, logger);


    const popItems2 = [
        {  path: 'previousBuyers' ,select:" name fatherName cnic phoneNumber email " },
        {  path: 'newBuyers' ,select:" name fatherName cnic phoneNumber email " },
        { path: 'oldSale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
        { path: 'newSale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
        { path: 'inventory', populate: [
          { path: 'project',select:'title -_id'},
          { path: 'sector',select:'title -_id'},
          { path: 'currentSale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
        ]  },
        {
        path : 'createdBy',
        select: 'username image email -_id'}
      ]
exports.getSingleInventoryAllOwnerShips= catchAsync(async (req, res, next) => {

  const { inventory } = req.query;
    const query = {};

    if (inventory) {
      query.inventory = inventory;
    } 


    handlerFactory.getAll(OwnerShipHistory, popItems2, logger, query)(req, res, next)
});



function addPeriod(d, durationStr) {
  const map = {
    'Monthly':   { months: 1 },
    'Quarterly': { months: 3 },
    'Half Yearly': { months: 6 },
    'Monthly + Half Yearly': { months: 6 },
    'Yearly':    { years: 1 }
  };
  const inc = map[durationStr];
  if (!inc) throw new Error(`Unknown duration ${durationStr}`);
  return dayjs(d).add(inc.months||0, 'month').add(inc.years||0, 'year').toDate();
}