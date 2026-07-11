
const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse, getLongAutoIncrementId, displayNameFromBuyers } = require("../utils/helpers");
const AppError = require("../utils/appError");
const logger = require('../logger')('INVENTORY_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const APIFeatures = require("../utils/APIFeatures");
const User = require('../models/userModel');
const mongoose = require("mongoose");
const Inventory = require("../models/inventoryModel");
const { getNextInSequence } = require("../utils/db");
const { PREFIX_INVENTORY_AUTOINCREMENTID } = require("../constants/app.constants");
const Sale = require("../models/saleModel");
const { saleValidationSchema } = require("../validations/saleValidation");
const InstallmentPlan = require("../models/installmentPlanModel");
const Installment = require("../models/installmentModel");
const Payment = require("../models/paymentModel");
const { createPaymentSchema, verifyPaymentSchema } = require("../validations/paymentValidation");
const { submitSplitPayment, verifyPayment } = require("../utils/payments/paymentServices");
const { uploadBase64Image } = require("../utils/uploadFiles");



exports.createPayment = catchAsync(async (req, res, next) => {
    const {value, error } = createPaymentSchema.validate(req.body);
  if (error) {
    return next( new AppError(error.details[0].message, 400));
  }
    if (req.body.files && Array.isArray(req.body.files) && req.body.files.length > 0) {
      const uploadDir = `/uploads/${req.uploadDirectory}`;
      const attachments = [];
  
      for (let i = 0; i < req.body.files.length; i++) {
        const att = req.body.files[i];
        if (!att) continue;
  
        if (att) {
          const fileUrl = att;
  
          // If it's a base64 data URL, upload it
          if (fileUrl.includes(",")) {
            const base64String = fileUrl.split(",")[1];
            if (!base64String) continue;
  
            const result = await uploadBase64Image(base64String, uploadDir);
            const relativeAddress = `${req.uploadDirectory}/${result.fileName}`;
  
            attachments.push( relativeAddress);
          } else {
            // Already a saved path/URL, keep it
            // attachments.push(fileUrl);
          }
        }
      }
  
      req.body.files = attachments;
    }
    try {
   const doc = await submitSplitPayment({
      installmentId: req.body.installment,
      inventoryId: null,
      parts: req.body.parts,
      receiptNo: req.body.receiptNo,
      createdBy: req.user?._id,
      files:req.body.files??[],
      notes:req.body.notes??""
    });

  sendSuccessResponse(res, 200, logger, {
    message: "Payment submitted successfully.",
    doc,
  });}
    catch (err) {
    return next(err);
  }
});

exports.mergePayment = catchAsync(async (req, res, next) => {
  const { paymentIds, mergeNotes = "" } = req.body;
  if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length < 2) {
    return next( new AppError("Select at least 2 payments to merge.", 400));
  }
      // Ensure unique ids
  const uniqueIds = [...new Set(paymentIds.map(String))];

    try {
          const payments = await Payment.find({ _id: { $in: uniqueIds } }).populate(popItems);
          if (payments.length !== uniqueIds.length) {
            return next( new AppError("Some payments not found.", 404));
          }
 // Validate each payment
    for (const p of payments) {
      if (p.isMerged || p.mergedInto) {
        return next( new AppError(`Payment ${p._id} is already merged into another payment.`, 400));
      }
      if (p.status !== "approved") {
        return next( new AppError(`Payment ${p._id} is not in approved status and cannot be merged.`, 400));
      }
    }

// Validate they belong to same grouping
    const saleId = String(payments[0].sale._id??payments[0].sale);
    const installmentId = String(payments[0].installment._id??payments[0].installment);
    const inventoryId = String(payments[0].inventory._id??payments[0].inventory);

    const mismatch = payments.find(p =>
      String(p.sale._id??p.sale) !== saleId ||
      String(p.installment._id??p.installment) !== installmentId ||
      String(p.inventory._id??p.inventory) !== inventoryId
    );
    if (mismatch) {
      return next( new AppError("All payments must belong to the same sale, installment, and inventory to be merged.", 400));
    }
     // Build merged parts
    const mergedParts = payments.flatMap(p => (p.parts || []).map(part => ({
      method: part.method,
      amount: part.amount,
      paidAt: part.paidAt,
      other: part.other || "",
      reference: part.reference || ""
    })));

    const totalAmount = mergedParts.reduce((sum, x) => sum + Number(x.amount || 0), 0);

    if (totalAmount < 1) {
        return next( new AppError("Total amount of merged payment must be at least 1.", 400));
    }

    // Choose paidAt strategy: latest paidAt (common for “finalized” receipt)
    const paidAt = payments
      .map(p => new Date(p.paidAt))
      .sort((a, b) => b - a)[0];

    // Combine files (optional)
    const mergedFiles = [...new Set(payments.flatMap(p => p.files || []))];

    // Use creator: the user performing merge
    const createdBy = req.user?._id || payments[0].createdBy;

  const newIDNumber = await getNextInSequence("payments");
  const longAutoIncrementId = getLongAutoIncrementId(
    `PR-${payments[0].inventory?.sector?.title}`,
    newIDNumber
  );
  
      // Create merged payment
    const mergedPayment = await Payment.create({
         autoIncrementId: newIDNumber,
    longAutoIncrementId: longAutoIncrementId,
      sale: saleId,
      installment: installmentId,
      inventory: inventoryId,
      totalAmount,
      receiptNo:longAutoIncrementId,
      parts: mergedParts,
      status: "approved",
      verifiedBy: req.user?._id,      // optional
      verifiedAt: new Date(),         // optional
      paidAt,
      autoAssign: false,
      notes: `Merged receipt from payments: ${uniqueIds.join(", ")}`,
      createdBy,
      files: mergedFiles,

      mergedFrom: uniqueIds,
      mergeNotes,
      isMerged: false,
      mergedInto: null,
    });
      
     // Mark old payments as voided & merged into new one
    await Payment.updateMany(
      { _id: { $in: uniqueIds } },
      {
        $set: {
          status: "voided",
          isMerged: true,
          mergedInto: mergedPayment._id,
          verifyNotes: "Merged into a combined receipt.",
        }
      },
      { multi: true }
    );
    //  const doc = await submitSplitPayment({
    //     installmentId: req.body.installment,
    //     inventoryId: null,
    //     parts: req.body.parts,
    //     receiptNo: req.body.receiptNo,
    //     createdBy: req.user?._id,
    //     files:req.body.files??[],
    //     notes:req.body.notes??""
    //   });
  
  sendSuccessResponse(res, 200, logger, {
    message: "Payment merged successfully.",
    doc: mergedPayment,
  });}
    catch (err) {
    return next(err);
  }
});


exports.mergePendingPayment = catchAsync(async (req, res, next) => {
  const { paymentIds, mergeNotes = "" } = req.body;
  if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length < 2) {
    return next( new AppError("Select at least 2 payments to merge.", 400));
  }
      // Ensure unique ids
  const uniqueIds = [...new Set(paymentIds.map(String))];

    try {
          const payments = await Payment.find({ _id: { $in: uniqueIds } }).populate(popItems);
          if (payments.length !== uniqueIds.length) {
            return next( new AppError("Some payments not found.", 404));
          }
 // Validate each payment
    for (const p of payments) {
      if (p.isMerged || p.mergedInto) {
        return next( new AppError(`Payment ${p._id} is already merged into another payment.`, 400));
      }
      if (p.status !== "pending") {
        return next( new AppError(`Payment ${p._id} is not in pending status and cannot be merged.`, 400));
      }
    }

// Validate they belong to same grouping
    const saleId = String(payments[0].sale._id??payments[0].sale);
    const installmentId = String(payments[0].installment._id??payments[0].installment);
    const inventoryId = String(payments[0].inventory._id??payments[0].inventory);

    const mismatch = payments.find(p =>
      String(p.sale._id??p.sale) !== saleId ||
      String(p.installment._id??p.installment) !== installmentId ||
      String(p.inventory._id??p.inventory) !== inventoryId
    );
    if (mismatch) {
      return next( new AppError("All payments must belong to the same sale, installment, and inventory to be merged.", 400));
    }
     // Build merged parts
    const mergedParts = payments.flatMap(p => (p.parts || []).map(part => ({
      method: part.method,
      amount: part.amount,
      paidAt: part.paidAt,
      other: part.other || "",
      reference: part.reference || ""
    })));

    const totalAmount = mergedParts.reduce((sum, x) => sum + Number(x.amount || 0), 0);

    if (totalAmount < 1) {
        return next( new AppError("Total amount of merged payment must be at least 1.", 400));
    }

    // Choose paidAt strategy: latest paidAt (common for “finalized” receipt)
    const paidAt = payments
      .map(p => new Date(p.paidAt))
      .sort((a, b) => b - a)[0];

    // Combine files (optional)
    const mergedFiles = [...new Set(payments.flatMap(p => p.files || []))];

    // Use creator: the user performing merge
    const createdBy = req.user?._id || payments[0].createdBy;

  const newIDNumber = await getNextInSequence("payments");
  const longAutoIncrementId = getLongAutoIncrementId(
    `PR-${payments[0].inventory?.sector?.title}`,
    newIDNumber
  );
  
      // Create merged payment
    const mergedPayment = await Payment.create({
         autoIncrementId: newIDNumber,
    longAutoIncrementId: longAutoIncrementId,
      sale: saleId,
      installment: installmentId,
      inventory: inventoryId,
      totalAmount,
      receiptNo:longAutoIncrementId,
      parts: mergedParts,
      status: "pending",
      // verifiedBy: req.user?._id,      // optional
      // verifiedAt: new Date(),         // optional
      paidAt,
      autoAssign: false,
      notes: `Merged receipt from payments: ${uniqueIds.join(", ")}`,
      createdBy,
      files: mergedFiles,

      mergedFrom: uniqueIds,
      mergeNotes,
      isMerged: false,
      mergedInto: null,
    });
      
     // Mark old payments as voided & merged into new one
    await Payment.updateMany(
      { _id: { $in: uniqueIds } },
      {
        $set: {
          status: "voided",
          isMerged: true,
          mergedInto: mergedPayment._id,
          verifyNotes: "Merged into a combined receipt.",
        }
      },
      { multi: true }
    );
    //  const doc = await submitSplitPayment({
    //     installmentId: req.body.installment,
    //     inventoryId: null,
    //     parts: req.body.parts,
    //     receiptNo: req.body.receiptNo,
    //     createdBy: req.user?._id,
    //     files:req.body.files??[],
    //     notes:req.body.notes??""
    //   });
  
  sendSuccessResponse(res, 200, logger, {
    message: "Payment merged successfully.",
    doc: mergedPayment,
  });}
    catch (err) {
    return next(err);
  }
});

exports.createInventoryPayment = catchAsync(async (req, res, next) => {
    const {value, error } = createPaymentSchema.validate(req.body);
  if (error) {
    return next( new AppError(error.details[0].message, 400));
  }
    if (req.body.files && Array.isArray(req.body.files) && req.body.files.length > 0) {
      const uploadDir = `/uploads/${req.uploadDirectory}`;
      const attachments = [];
  
      for (let i = 0; i < req.body.files.length; i++) {
        const att = req.body.files[i];
        if (!att) continue;
  
        if (att) {
          const fileUrl = att;
  
          // If it's a base64 data URL, upload it
          if (fileUrl.includes(",")) {
            const base64String = fileUrl.split(",")[1];
            if (!base64String) continue;
  
            const result = await uploadBase64Image(base64String, uploadDir);
            const relativeAddress = `${req.uploadDirectory}/${result.fileName}`;
  
            attachments.push( relativeAddress);
          } else {
            // Already a saved path/URL, keep it
            // attachments.push(fileUrl);
          }
        }
      }
  
      req.body.files = attachments;
    }
 
  try {
       const doc = await submitSplitPayment({
       inventoryId: value.inventory,    
       installmentId: null,
      parts: value.parts,
      receiptNo: value.receiptNo,
      createdBy: req.user?._id,
      files:req.body.files??[],
      notes:req.body.notes??""
    });

  sendSuccessResponse(res, 200, logger, {
    message: "Payment submitted successfully.",
    doc,
  });
  } catch (err) {
    return next(err);
  }
});


exports.verifyPayment = catchAsync(async (req, res, next) => {
    const {value, error } = verifyPaymentSchema.validate(req.body);
  if (error) {
    return next( new AppError(error.details[0].message, 400));
  }
  
 try{  const doc = await verifyPayment({
      paymentId: value.payment,
      approve: value.approve === true,
      notes: value.notes,
      adminId: req.user?._id
    });

  sendSuccessResponse(res, 200, logger, {
    message: "Payment submitted successfully.",
    doc,
  });}
   catch (err) {
    return next(err);
  }
});

    const popItems = [
        { path: 'installment',  },
        { path: 'inventory', populate: [
          { path: 'project',select:'title -_id'},
          { path: 'sector',select:'title -_id'},
          { path: 'currentSale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
        ]  },
        { path: 'sale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
          {
        path : 'createdBy',
        select: 'username image email -_id'},
          {
        path : 'verifiedBy',
        select: 'username image email -_id'}
      ]
exports.getAllPayments = catchAsync(async (req, res, next) => {

  const { inventory,installment,status } = req.query;
    let query = {};

    if (inventory) {
      query.inventory = inventory;
    } else if (installment) {
      query.installment = installment;
    }
    else if (status) {
      query.status = status;
    }
      req.query.sort = "paidAt:desc";


    handlerFactory.getAll(Payment, popItems, logger, query)(req, res, next)
});

exports.getSinglePayment = handlerFactory.getOne(Payment ,popItems, logger);





