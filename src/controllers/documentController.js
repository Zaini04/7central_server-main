const logger = require('../logger')('CUSTOMER_CONTROLLER');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Customer = require('../models/customerModel');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_DOCUMENT_AUTOINCREMENTID } = require('../constants/app.constants');
const {customerDocumentValidationSchema, inventoryDocumentValidationSchema, updateDocumentValidationSchema} = require('../validations/documentValidation');
const Inventory = require('../models/inventoryModel');
const Document = require('../models/documentModel');
const handlerFactory = require('./factories/handlerFactory');
const { uploadBase64Image } = require('../utils/uploadFiles');

exports.createCustomerDocument = catchAsync(async (req, res, next) => {

  const { error } = customerDocumentValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.body.createdBy = req.user._id;
  req.body.assignType = "customer";

    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      return next(new AppError("Customer not found.", 404));
    }

if (req.body.attachments && Array.isArray(req.body.attachments) && req.body.attachments.length > 0) {
    
    const uploadDir = `/uploads/${req.uploadDirectory}`;
    const attachments = [];

    for (let i = 0; i < req.body.attachments.length; i++) {
      if(!req.body.attachments[i]) continue;
      if(req.body.attachments[i].fileUrl){
        const image = req.body.attachments[i].fileUrl;
        if (!image) continue;
        const base64String = image.split(",")[1]; 
        const result = await uploadBase64Image(base64String, uploadDir);
        const relativeAddress = `${req.uploadDirectory}/${result.fileName}`;
        attachments.push({
            fileUrl: relativeAddress,
            tags: req.body.tags?.[i] || []     // default empty array
        });
      }
      
       
    }

    req.body.attachments = attachments;

    delete req.body.images;
    delete req.body.image;
}

  const document = await Document.create(req.body);

  const newIDNumber = await getNextInSequence("documents");
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_DOCUMENT_AUTOINCREMENTID,
    newIDNumber
  );

  document.autoIncrementId = newIDNumber;
  document.longAutoIncrementId = longAutoIncrementId;
  await document.save();

  sendSuccessResponse(res, 200, logger, {
    message: "Document created successfully.",
    doc: document,
  });
});
exports.updateCustomerDocument = catchAsync(async (req, res, next) => {
  const docId = req.params.id;

  const { error } = customerDocumentValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Force type
  req.body.assignType = "customer";
  req.body.updatedBy = req.user._id;

  // Ensure customer exists (use body.customer if sent, otherwise keep as-is)
  if (req.body.customer) {
    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      return next(new AppError("Customer not found.", 404));
    }
  }

  // Handle attachments (support both existing URLs and new base64)
  if (req.body.attachments && Array.isArray(req.body.attachments) && req.body.attachments.length > 0) {
    const uploadDir = `/uploads/${req.uploadDirectory}`;
    const attachments = [];

    for (let i = 0; i < req.body.attachments.length; i++) {
      const att = req.body.attachments[i];
      if (!att) continue;

      if (att.fileUrl) {
        const fileUrl = att.fileUrl;

        // If it's a base64 data URL, upload it
        if (fileUrl.includes(",")) {
          const base64String = fileUrl.split(",")[1];
          if (!base64String) continue;

          const result = await uploadBase64Image(base64String, uploadDir);
          const relativeAddress = `${req.uploadDirectory}/${result.fileName}`;

          attachments.push({
            fileUrl: relativeAddress,
            tags: att.tags ?? req.body.tags?.[i] ?? []
          });
        } else {
          // Already a saved path/URL, keep it
          attachments.push({
            fileUrl,
            tags: att.tags ?? req.body.tags?.[i] ?? []
          });
        }
      }
    }

    req.body.attachments = attachments;

    delete req.body.images;
    delete req.body.image;
  }

  const document = await Document.findOneAndUpdate(
    { _id: docId, assignType: "customer" },
    req.body,
    { new: true, runValidators: true }
  );

  if (!document) {
    return next(new AppError("Customer document not found.", 404));
  }

  sendSuccessResponse(res, 200, logger, {
    message: "Document updated successfully.",
    doc: document,
  });
});

exports.createInventoryDocument = catchAsync(async (req, res, next) => {

  const { error } = inventoryDocumentValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.body.createdBy = req.user._id;
  req.body.assignType = "inventory";
  const inventory = await Inventory.findById(req.body.inventory);
    if (!inventory) {
      return next(new AppError("Inventory not found.", 404));
    }
    
if (req.body.attachments && Array.isArray(req.body.attachments) && req.body.attachments.length > 0) {
    
    const uploadDir = `/uploads/${req.uploadDirectory}`;
    const attachments = [];

    for (let i = 0; i < req.body.attachments.length; i++) {
      if(!req.body.attachments[i]) continue;
      if(req.body.attachments[i].fileUrl){
        const image = req.body.attachments[i].fileUrl;
        if (!image) continue;
        const base64String = image.split(",")[1]; 
        const result = await uploadBase64Image(base64String, uploadDir);
        const relativeAddress = `${req.uploadDirectory}/${result.fileName}`;
        attachments.push({
            fileUrl: relativeAddress,
            tags: req.body.tags?.[i] || []     // default empty array
        });
      }
      
       
    }

    req.body.attachments = attachments;

    delete req.body.images;
    delete req.body.image;
}

  const document = await Document.create(req.body);

  const newIDNumber = await getNextInSequence("documents");
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_DOCUMENT_AUTOINCREMENTID,
    newIDNumber
  );

  document.autoIncrementId = newIDNumber;
  document.longAutoIncrementId = longAutoIncrementId;
  await document.save();

  sendSuccessResponse(res, 200, logger, {
    message: "Document created successfully.",
    doc: document,
  });
});
exports.updateInventoryDocument = catchAsync(async (req, res, next) => {
  const docId = req.params.id;

  const { error } = inventoryDocumentValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Force type
  req.body.assignType = "inventory";
  req.body.updatedBy = req.user._id;

  // Ensure inventory exists (if changing inventory)
  if (req.body.inventory) {
    const inventory = await Inventory.findById(req.body.inventory);
    if (!inventory) {
      return next(new AppError("Inventory not found.", 404));
    }
  }

  // Handle attachments (support both existing URLs and new base64)
  if (req.body.attachments && Array.isArray(req.body.attachments) && req.body.attachments.length > 0) {
    const uploadDir = `/uploads/${req.uploadDirectory}`;
    const attachments = [];

    for (let i = 0; i < req.body.attachments.length; i++) {
      const att = req.body.attachments[i];
      if (!att) continue;

      if (att.fileUrl) {
        const fileUrl = att.fileUrl;

        // If it's a base64 data URL, upload it
        if (fileUrl.includes(",")) {
          const base64String = fileUrl.split(",")[1];
          if (!base64String) continue;

          const result = await uploadBase64Image(base64String, uploadDir);
          const relativeAddress = `${req.uploadDirectory}/${result.fileName}`;

          attachments.push({
            fileUrl: relativeAddress,
            tags: att.tags ?? req.body.tags?.[i] ?? []
          });
        } else {
          // Already uploaded path/URL
          attachments.push({
            fileUrl,
            tags: att.tags ?? req.body.tags?.[i] ?? []
          });
        }
      }
    }

    req.body.attachments = attachments;

    delete req.body.images;
    delete req.body.image;
  }

  const document = await Document.findOneAndUpdate(
    { _id: docId, assignType: "inventory" },
    req.body,
    { new: true, runValidators: true }
  );

  if (!document) {
    return next(new AppError("Inventory document not found.", 404));
  }

  sendSuccessResponse(res, 200, logger, {
    message: "Document updated successfully.",
    doc: document,
  });
});

    const popItems = [
        { path: 'customer', select: 'name email fatherName cnic phoneNumber' },
        { path: 'inventory',  },
            {
        path : 'createdBy',
        select: 'username image email -_id'}
    ]

exports.getAllDocuments= catchAsync(async (req, res, next) => {
    const { inventory,customer } = req.query;
    const query = {};

    if (inventory) {
      query.inventory = inventory;
    } else if (customer) {
      query.customer = customer;
    }


    handlerFactory.getAll(Document, popItems, logger, query)(req, res, next)
});

exports.updateDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
    if (req.files && req.files.length > 0) {
     req.body.attachments = req.files.map((file, index) => ({
    fileUrl: `/uploads/${req.uploadDirectory}/${file.filename}`,
      tags: req.body.attachments?.[index]?.tags || []
    }));
    }
  const { error } = updateDocumentValidationSchema.validate(req.body,);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const document = await Document.findOne({ _id: id, assignType: "customer" });
  if (!document) {
    return next(new AppError("Customer document not found.", 404));
  }

  delete req.body.customer;
  delete req.body.assignType;
  delete req.body.inventory;
  if(req.body.type===null || req.body.type===undefined || req.body.type===''){
    delete req.body.type;
  }
  if(req.body.name===null || req.body.name===undefined || req.body.name===''){
    delete req.body.name;
  }
  if(req.body.attachments===null || req.body.attachments===undefined || req.body.attachments.length===0){
    delete req.body.attachments;
  }

  Object.assign(document, req.body);
  await document.save();

  sendSuccessResponse(res, 200, logger, {
    message: "Customer document updated successfully.",
    doc: document,
  });
});



exports.deleteOne = handlerFactory.deleteOne(Document , logger);
