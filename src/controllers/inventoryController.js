
const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse, getLongAutoIncrementId } = require("../utils/helpers");
const AppError = require("../utils/appError");
const logger = require('../logger')('INVENTORY_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const APIFeatures = require("../utils/APIFeatures");
const User = require('../models/userModel');
const mongoose = require("mongoose");
const { inventoryValidationSchema } = require("../validations/inventoryValidation");
const Inventory = require("../models/inventoryModel");
const { getNextInSequence } = require("../utils/db");
const { PREFIX_INVENTORY_AUTOINCREMENTID, NUMBERS_DIR } = require("../constants/app.constants");
const Sale = require("../models/saleModel");
const OwnerShipHistory = require("../models/ownershipHistoryModel");
const Project = require("../models/projectModel");
const Sector = require("../models/sectorModel");
const { uploadDataFile } = require("../utils/uploadFiles");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const { DateTime } = require("luxon");
const Installment = require("../models/installmentModel");
    const popItems = [
        { path: 'project', select: 'title' },
        { path: 'sector', select: 'title' },
        { path: 'currentSale', populate: 
          [{ path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} ,
            { path: 'plan' }
          ]},
        {
        path : 'createdBy',
        select: 'username image email -_id'}
      ]

exports.createInventory = catchAsync(async (req, res, next) => {
  const { error } = inventoryValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  const createdBy = req.user._id;
  req.body.createdBy = createdBy;

  const inventory = await Inventory.create(req.body);

  // Generate auto-incremented ID
  const newIDNumber = await getNextInSequence("inventories");
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_INVENTORY_AUTOINCREMENTID,
    newIDNumber
  );
  inventory.autoIncrementId = newIDNumber;
  inventory.longAutoIncrementId = longAutoIncrementId;
  await inventory.save();

  // Send response
  sendSuccessResponse(res, 200, logger, {
    message: 'Inventory created successfully.',
    doc: inventory,
  });
});



// ALL POPULATE OBJECTS
const popObj = [
        { path: 'currentSale', populate: { path: 'buyers' ,select:" name fatherName cnic phoneNumber email "} },
    { path: 'project', },
    { path: 'sector', },

];

exports.getAllInventories = catchAsync(async (req, res, next) => {
    const { project,sector,type,status } = req.query;
    const query = {};

    if (project) {
      query.project = project;
    } else if (sector) {
      query.sector = sector;
    }
    else if (type) {
      query.type = type;
    }
    else if (status) {
      query.status = status;
    }


    handlerFactory.getAll(Inventory, popItems, logger, query)(req, res, next)
});


exports.createCSVUploadOfInventory= catchAsync(async (req, res, next) => {
  const validData= req.body;
  // if (error) {
  //   return next(new AppError(error.details[0].message, 422));
  // }

  const existingProject= await Project.findById(validData.project);

  if (!existingProject) {
    return sendErrorResponse(res, 422, logger, {
      message: `Project not found!`,
    });
  }

  let existingTermination = null;

   const existingSector = await Sector.findById(validData.sector);

  // Read CSV file
  const base64String = validData.csvDataURI.split(",")[1];
  let fileNameOnServerDisk;

  try {
    fileNameOnServerDisk = await uploadDataFile(
      base64String,
      NUMBERS_DIR,
      `.csv`,
    );
  } catch (err) {
    console.error(err);
    return sendErrorResponse(res, 500, logger, {
      message: "File upload failed",
      doc: null,
    });
  }

  let filePath = path.join(
    __dirname,
    "../uploads",
    NUMBERS_DIR,
    fileNameOnServerDisk,
  );

  const requestReceivedOn = DateTime.now();

  const results = [];

  // 1) /upload-numbers 2) /create-csv-upload-of-numbers
  // If you choose to modify "end" event handling function,
  // be sure to identical modifications in other endpoint

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        // results is an array of objects

        const insertMany = [];

        let terminationsCreated = [];
        let terminationTestNumberMap = new Map();

        for (let el of results) {

          const newIDNumber = await getNextInSequence("inventories");
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_INVENTORY_AUTOINCREMENTID,
    newIDNumber
  );
          let data = {
            autoIncrementId: newIDNumber,
            longAutoIncrementId: longAutoIncrementId,
            project:existingProject._id, sector:existingSector._id, 
            createdBy: req.user._id,...el};
            insertMany.push(data);

         
        }

        let numbersCreatedCount = 0;

        try {
          
          console.info(`About to create inventories: ${insertMany.length}`);
          console.info(`About to create inventories: ${insertMany}`);

          const newNumbers = await Inventory.insertMany(insertMany);

      
  sendSuccessResponse(res, 201, logger, {
            doc: {
              message: `Numbers creation in progress! Please wait...`,
            },
          });
        
        } catch (err) {
          console.error(err);
          logger.error(err.message);

          // const requestFailedOn = DateTime.now();

          // const admins = await User.find({ roles: "admin" });
          // for (let admin of admins) {
          //   await Notification.create({
          //     user: admin._id,
          //     title: `CSV Upload Failed`,
          //     body: `The system received your request on ${requestReceivedOn} and failed on ${requestFailedOn}. The system was able to create ${numbersCreatedCount} numbers.`,
          //   });
          // }

          // let message = `Database create operation failed!`;

          // if (err.insertedDocs?.length > 0) {
          //   numbersCreatedCount += err.insertedDocs?.length;
          //   message += ` Numbers created: ${numbersCreatedCount}}`;
          // }

          // logger.error(message);
        }
      } catch (err) {
        console.error(err);
        logger.error(err.message);
        let msg =
          process.env.NODE_ENV === "development"
            ? err.message
            : `Unknown error occurred! Possible error: Wrong header row`;
        return sendErrorResponse(res, 500, logger, {
          message: msg,
        });
      }
    });
});

exports.inventoryPaymentStats = catchAsync(async(req , res , next) => {
    const { inventory } = req.query;
    
const checkInventory = await Inventory.findById(inventory);

if (!checkInventory) {
  return next(new AppError('Inventory not found', 404));
}

  const matchStage = {
    inventory:checkInventory._id,
    $or: [
      // Paid ones in this window
      { status: 'paid', },
      // Pending/overdue ones whose dueDate is in this window
      {
        status: { $in: ['un-paid', 'overdue','pertially_paid','defaulted'] },
       
      }
    ]
  };

  const installmentStats = await Installment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    }
  ]);

  const byStatus = installmentStats.reduce((acc, row) => {
    acc[row._id] = { count: row.count, amount: row.amount };
    return acc;
  }, {});

  const paid = byStatus['paid'] || { count: 0, amount: 0 };
  const scheduled = byStatus['un-paid'] || { count: 0, amount: 0 };
  const overdue = byStatus['overdue'] || { count: 0, amount: 0 };

  // Pending = scheduled + overdue
  const pendingCount = scheduled.count + overdue.count;
  const pendingAmount = scheduled.amount + overdue.amount;

  const totalReceiptsCount = paid.count + pendingCount;
  const totalReceiptsAmount = paid.amount + pendingAmount;

  // C) Prepare response matching your UI cards
  const data= {
    totalInstallments: totalReceiptsCount,
    totalAmount: totalReceiptsAmount,
    paidInstallments: paid.count,

    installments: {
      totalInstallmentsCount:totalReceiptsCount,
      totalInstallmentsAmount:totalReceiptsAmount,

      paid: {
        count: paid.count,
        amount: paid.amount
      },
      overdue: {
        count: overdue.count,
        amount: overdue.amount
      },
      unpaid: {
        // unpaid = scheduled + overdue
        count: scheduled.count + overdue.count,
        amount: scheduled.amount + overdue.amount
      }
    }
  };


    sendSuccessResponse(res , 200 , logger , {
        ...data
    })
})


exports.getSingle = handlerFactory.getOne(Inventory ,popItems, logger);
exports.update = handlerFactory.updateOne(Inventory , logger);
exports.deleteInventory = handlerFactory.deleteOne(Inventory , logger);