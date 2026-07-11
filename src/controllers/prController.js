
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
const { createPRSchema, bouncedPRSchema } = require("../validations/prValidations");
const { createPR, markPRBounced, clearPR } = require("../utils/payments/prService");
const ProvisionalReceipt = require("../models/provisionalReceiptModel");
const { uploadBase64Image } = require("../utils/uploadFiles");



exports.createProvisionalReceipt = catchAsync(async (req, res, next) => {
    const {value, error } = createPRSchema.validate(req.body);
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
   const doc = await createPR({
      inventoryId: value.inventory,
      bankName: value.bankName,
      chequeNo: value.chequeNo,
      chequeDate: value.chequeDate,
      amount: value.amount,
      notes: value.notes,
      files: req.body.files??[],
      createdBy: req.user._id
    });

  sendSuccessResponse(res, 200, logger, {
    message: "Payment submitted successfully.",
    doc,
  });}
    catch (err) {
    return next(err);
  }
});

exports.updatePRBounce = catchAsync(async (req, res, next) => {
    const {value, error } = bouncedPRSchema.validate(req.body);
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
   const doc =await markPRBounced({
      prId: req.params.id,
      reason: req.body.reason,
      files: req.body.files,
      userId: req.user._id
    });

  sendSuccessResponse(res, 200, logger, {
    message: "Updated successfully.",
    doc,
  });}
    catch (err) {
    return next(err);
  }
});

exports.updatePRApproved = catchAsync(async (req, res, next) => {
   
    try {
  const payment = await clearPR({
      prId: req.params.id,
      userId: req.user._id
    });

  sendSuccessResponse(res, 200, logger, {
    message: "Provisional Receipt promoted to Payment successfully.",
    payment,
  });}
    catch (err) {
    return next(err);
  }
});


    const popItems = [
        { path: 'inventory',  },
        { path: 'sale',  },

        { path: 'buyers',  },
                {
        path : 'createdBy',
        select: 'username image email -_id'},
            {
        path : 'updatedBy',
        select: 'username image email -_id'},
       ]
exports.getAllPRs= catchAsync(async (req, res, next) => {

  const { inventory,customer,status } = req.query;
    const query = {};

    if (inventory) {
      query.inventory = inventory;
    } else if (customer) {
      query.customer = {};
    }
    else if (status) {
      query.status = status;
    }


    handlerFactory.getAll(ProvisionalReceipt, popItems, logger, query)(req, res, next)
});





