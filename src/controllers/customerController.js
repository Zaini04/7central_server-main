const logger = require('../logger')('CUSTOMER_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const { uploadBase64Image } = require('../utils/uploadFiles');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {customerValidationSchema, partnerValidationSchema} = require('../validations/customerValidations');
const Customer = require('../models/customerModel');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_CUSTOMER_AUTOINCREMENTID, PREFIX_JOINT_AUTOINCREMENTID, PREFIX_KIN_AUTOINCREMENTID } = require('../constants/app.constants');
const Partner = require('../models/partnerModel');
const NotificationSetting = require('../models/notificationSettingModel');
const Document = require('../models/documentModel');
const Sale = require('../models/saleModel');
const mongoose = require("mongoose");
const Installment = require('../models/installmentModel');
const Payment = require('../models/paymentModel');
const ProvisionalReceipt = require('../models/provisionalReceiptModel');

const popObj = [
    {
        path : 'createdBy',
        select: 'username image email -_id'}
]

exports.create = catchAsync(async (req, res, next) => {
  const { error } = customerValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const createdBy = req.user._id;
  req.body.createdBy = createdBy;

  if(req.body.image && req.body.image.startsWith('data:image/')) {
     const base64String = req.body.image.split(",")[1];
    const uploadDir = `/uploads/${req.uploadDirectory}`;

    const result = await uploadBase64Image(base64String, uploadDir);
    const relativeAddress = `${req.uploadDirectory}/${result.fileName}`;
    req.body.image = relativeAddress;
  }

  const customer = await Customer.create(req.body);

  // Generate auto-incremented ID
  const newIDNumber = await getNextInSequence("customers");
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_CUSTOMER_AUTOINCREMENTID,
    newIDNumber
  );
  customer.autoIncrementId = newIDNumber;
  customer.longAutoIncrementId = longAutoIncrementId;
  await customer.save();

  // Send response
  sendSuccessResponse(res, 200, logger, {
    message: 'Customer created successfully.',
    doc: customer,
  });
});

exports.createJoint = catchAsync(async (req, res, next) => {
  const createdBy = req.user._id;
  const inputData = Array.isArray(req.body) ? req.body : [req.body]; 

  // Validate and prepare data
  const validatedData = [];
  for (const data of inputData) {
    const { error } = partnerValidationSchema.validate(data);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }

    // Check if customer exists
    const customer = await Customer.findById(data.customer);
    if (!customer) {
      return next(new AppError('Customer not found.', 404));
    }

    data.createdBy = createdBy;
    data.type = 'joint';
    validatedData.push(data);
  }

  const partners = await Partner.insertMany(validatedData);

  for (const partner of partners) {
    const newIDNumber = await getNextInSequence('partners');
    const longAutoIncrementId = getLongAutoIncrementId(
      PREFIX_JOINT_AUTOINCREMENTID,
      newIDNumber
    );
    partner.autoIncrementId = newIDNumber;
    partner.longAutoIncrementId = longAutoIncrementId;
    await partner.save();
  }

  sendSuccessResponse(res, 200, logger, {
    message:
      partners.length > 1
        ? `${partners.length} joint partners created successfully.`
        : 'Joint partner created successfully.',
    docs: partners,
  });
});


exports.createNextOfKin = catchAsync(async (req, res, next) => {
  const { error } = partnerValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const createdBy = req.user._id;
  req.body.createdBy = createdBy;

  const customer = await Customer.findById(req.body.customer);
  if (!customer) {
    return next(new AppError('Customer not found.', 404));
  }

    req.body.type = 'next_of_kin';
  const kinPartners = await Partner.findOne({ customer: customer._id ,type: 'next_of_kin' });
    if (kinPartners) {
        return next(new AppError('Next of Kin already exists for this customer.', 400));
    }

  const partner = await Partner.create(req.body);

  // Generate auto-incremented ID
  const newIDNumber = await getNextInSequence("partners");
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_KIN_AUTOINCREMENTID,
    newIDNumber
  );
  partner.autoIncrementId = newIDNumber;
  partner.longAutoIncrementId = longAutoIncrementId;
  await partner.save();

  // Send response
  sendSuccessResponse(res, 200, logger, {
    message: 'Next of Kin created successfully.',
    doc: partner,
  });
});

exports.updateNextOfKin = catchAsync(async (req, res, next) => {
  const partnerId = req.params.id;

  // Validate incoming payload
  const { error } = partnerValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Ensure it is next_of_kin
  req.body.type = 'next_of_kin';

  // Validate customer ID
  const customer = await Customer.findById(req.body.customer);
  if (!customer) {
    return next(new AppError('Customer not found.', 404));
  }

  // Check if another Kin exists for same customer
  const existingKin = await Partner.findOne({
    customer: req.body.customer,
    type: "next_of_kin",
    _id: { $ne: new mongoose.Types.ObjectId(partnerId) }   // exclude the doc being updated
  });

  if (existingKin) {
    return next(new AppError('Next of Kin already exists for this customer.', 400));
  }

  // Update
  const updatedKin = await Partner.findByIdAndUpdate(
    partnerId,
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedKin) {
    return next(new AppError("Next of Kin not found.", 404));
  }

  sendSuccessResponse(res, 200, logger, {
    message: "Next of Kin updated successfully.",
    doc: updatedKin
  });
});


exports.getProgress = catchAsync(async (req, res, next) => {
  const customerId = req.params.id;
   const { inventory} = req.query;
  
  let  steps= {
          general: false,
          nextOfKin: false,
          notifications: false,
          documents: false,
          assignInventory: false,
          inventoryDocuments:false,
          installmentPlan: false
        };

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return sendSuccessResponse(res, 200, logger, {
    message: 'No progress found, all steps pending',
    doc: {customer:null,steps},
  });
  }
  else{
    steps.general = true;
  }

  const partners = await Partner.find({ customer: customerId });
  if (partners.some(p => p.type === 'joint')) {
  }
    if (partners.some(p => p.type === 'next_of_kin')) {
    steps.nextOfKin = true;
  }
  const notificationSetting = await NotificationSetting.findOne({ customer: customerId });
  if (notificationSetting) {
    steps.notifications = true;
  }
  const documentsCount = await Document.countDocuments({ customer: customerId,status: { $ne: 'deleted' } });
  if (documentsCount > 0) {
    steps.documents = true;
  }
  if(inventory){
    const salesCount = await Sale.countDocuments({  inventory:inventory });
    if (salesCount > 0) {
      steps.assignInventory = true;
    }
    const inventoryDocumentsCount = await Document.countDocuments({ inventory:inventory ,status: { $ne: 'deleted' } });
    if (inventoryDocumentsCount > 0) {
      steps.inventoryDocuments = true;
    }
  }

  // Send response
  sendSuccessResponse(res, 200, logger, {
    doc: {customer,steps,},
  });
});
exports.getSingle = catchAsync(async (req, res, next) => {
  const customerId = req.params.id;


  const customer = await Customer.findById(customerId).populate(popObj);
  if (!customer) {
       return next(new AppError('Customer not found.', 404));
  }
  else{
  }

  const jointPartners = await Partner.find({ customer: customer._id ,type: 'joint' });
  const kinPartner = await Partner.findOne({ customer: customerId ,type: 'next_of_kin' });
  
  const notificationSetting = await NotificationSetting.findOne({ customer: customer._id });

  const documents = await Document.find({ customer: customer._id,status: { $ne: 'deleted' } });

  const sales = await Sale.find({ buyers: { $all: [customer._id] } }).populate('inventory');
  // Send response
  sendSuccessResponse(res, 200, logger, {
    doc: {customer,nextOfKin:kinPartner,setting:notificationSetting,documents,sales}, 
  });
});
    const popItemsInventories = [
        { path: 'plan',  },
        { path: 'inventory', },
        { path: 'transferredTo', },
        { path: 'transferredFrom', },
            {
        path : 'createdBy',
        select: 'username image email -_id'}
       ]
exports.getCustomerInventories = catchAsync(async (req, res, next) => {
  const customerId = req.params.id;


  const customer = await Customer.findById(customerId).populate(popObj);
  if (!customer) {
       return next(new AppError('Customer not found.', 404));

  }
  else{
  }

  const query = { buyers: { $all: [customer._id] } };
  req.query.sort = 'createdAt:-1';
      handlerFactory.getAll(Sale, popItemsInventories, logger, query)(req, res, next)

});

    const popItemsInstallment = [
        { path: 'plan',  },
        { path: 'inventory', },
        { path: 'sale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
        //   {
        // path : 'createdBy',
        // select: 'username image email -_id'} 
      ]
exports.getCustomerInstallments = catchAsync(async (req, res, next) => {
  const customerId = req.params.id;


  const customer = await Customer.findById(customerId);
  if (!customer) {
       return next(new AppError('Customer not found.', 404));

  }
  else{
  }

  const sales = await Sale.find({ buyers: customer._id }, { _id: 1 });
    const saleIds = sales.map(s => s._id);

  if (!saleIds.length) {
    return sendSuccessResponse(res, 200, logger, {
      docs:[], 
    });
  }

    const { inventory,status } = req.query;
      const query = {};
  
      if (inventory) {
        query.inventory = inventory;
      } 
      else if (status) {
        query.status = status;
      }
    query.sale = { $in: saleIds };

    console.log(saleIds);
      // query.sort = { dueDate: 1 };
  // req.query.sort = 'dueDate:-1';

      handlerFactory.getAll(Installment, popItemsInstallment, logger, query)(req, res, next)
  
});
    const popItems = [
        { path: 'installment',  },
        { path: 'inventory', },
        { path: 'sale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
          {
        path : 'createdBy',
        select: 'username image email -_id'}
      ]
exports.getCustomerPayments = catchAsync(async (req, res, next) => {
  const customerId = req.params.id;
  const { inventory,installment,status } = req.query;
    const query = {};

    if (inventory) {
      query.inventory = inventory;
    } else if (installment) {
      query.installment = installment;
    }
    else if (status) {
      query.status = status;
    }



  const customer = await Customer.findById(customerId);
  if (!customer) {
       return next(new AppError('Customer not found.', 404));

  }
  else{
  }

  const sales = await Sale.find({ buyers: customer._id }, { _id: 1 });
    const saleIds = sales.map(s => s._id);

  if (!saleIds.length) {
    return sendSuccessResponse(res, 200, logger, {
      docs:[], 
    });
  }

  query.sale = { $in: saleIds };
      handlerFactory.getAll(Payment, popItems, logger, query)(req, res, next)

});
    const popItemsPR = [
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
exports.getCustomerPR = catchAsync(async (req, res, next) => {
  const customerId = req.params.id;


  const customer = await Customer.findById(customerId);
  if (!customer) {
       return next(new AppError('Customer not found.', 404));

  }
  else{
  }
 const { inventory,status } = req.query;
    const query = {};

    if (inventory) {
      query.inventory = inventory;
    } else if (customer) {
      query.buyers = {$all: [customer._id]};
    }
    else if (status) {
      query.status = status;
    }

      handlerFactory.getAll(ProvisionalReceipt, popItemsPR, logger, query)(req, res, next)
  
});


exports.getAll = catchAsync(async (req, res, next) => {

//  const { inventory,status } = req.query;
    let query = {};

   
      query.status = { $ne: 'deleted' };
    

      handlerFactory.getAll(Customer , popObj , logger,query)(req, res, next)
  
});




// exports.getAll = handlerFactory.getAll(Customer , popObj , logger);

// exports.getSingle = handlerFactory.getOne(Customer , '' , logger);
exports.update = handlerFactory.updateOne(Customer , logger);
exports.deleteOne = handlerFactory.deleteOne(Customer , logger);

