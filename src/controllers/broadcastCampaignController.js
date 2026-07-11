const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const logger = require("../logger/index.js")("BROADCAST_CAMPAIGN_CONTROLLER");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/helpers");

const BroadcastCampaign = require("../models/broadcastCampaignModel");
const User = require("../models/userModel");
const { sendBroadcastDirect } = require("../utils/reminders/sendReminderService");

const {
  createBroadcastCampaignJoiSchema,
  updateBroadcastCampaignJoiSchema,
  getBroadcastCampaignsJoiSchema,
} = require("../validations/broadcastCampaignValidation");
const Customer = require("../models/customerModel.js");

exports.create = catchAsync(async (req, res, next) => {
  const { value: validData, error } =
    createBroadcastCampaignJoiSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const doc = await BroadcastCampaign.create({
    ...validData,
    createdBy: req.user?._id || null,
  });

  return sendSuccessResponse(res, 201, logger, {
    message: "Broadcast campaign created successfully",
    doc,
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  const { value: validData, error } =
    getBroadcastCampaignsJoiSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const page = parseInt(validData.page) || 1;
  const pageSize = parseInt(validData.pageSize) || 20;

  const queryFilterDoc = {};
  if (validData.category) queryFilterDoc.category = validData.category;
  if (validData.status) queryFilterDoc.status = validData.status;

  const docs = await BroadcastCampaign.find(queryFilterDoc)
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .sort({ createdAt: -1 })
    .populate([
      { path: "createdBy", select: "name username email" },
      { path: "customers", select: "name username email phone" },
    ]);

  const docsCount = await BroadcastCampaign.countDocuments(queryFilterDoc);
  const pages = Math.ceil(docsCount / pageSize);

  return sendSuccessResponse(res, 200, logger, {
    message: "Broadcast campaigns fetched successfully",
    docs,
    docsCount,
    pages,
    page,
    pageSize,
  });
});

exports.getOne = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendErrorResponse(res, 422, logger, {
      message: "Invalid campaign ID!",
      doc: null,
    });
  }

  const doc = await BroadcastCampaign.findById(req.params.id).populate([
    { path: "createdBy", select: "name username email" },
    { path: "customers", select: "name username email phone" },
  ]);

  if (!doc) {
    return sendErrorResponse(res, 404, logger, {
      message: "Campaign not found!",
      doc: null,
    });
  }

  return sendSuccessResponse(res, 200, logger, {
    message: "Broadcast campaign fetched successfully",
    doc,
  });
});

exports.update = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendErrorResponse(res, 422, logger, {
      message: "Invalid campaign ID!",
      doc: null,
    });
  }

  const { value: validData, error } =
    updateBroadcastCampaignJoiSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const existing = await BroadcastCampaign.findById(req.params.id);
  if (!existing) {
    return sendErrorResponse(res, 404, logger, {
      message: "Campaign not found!",
      doc: null,
    });
  }

  if (existing.status === "sent") {
    return sendErrorResponse(res, 422, logger, {
      message: "Sent campaign cannot be updated",
      doc: null,
    });
  }

  const doc = await BroadcastCampaign.findByIdAndUpdate(
    req.params.id,
    validData,
    { new: true, runValidators: true }
  );

  return sendSuccessResponse(res, 200, logger, {
    message: "Broadcast campaign updated successfully",
    doc,
  });
});

exports.send = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendErrorResponse(res, 422, logger, {
      message: "Invalid campaign ID!",
      doc: null,
    });
  }

  const campaign = await BroadcastCampaign.findById(req.params.id);
  if (!campaign) {
    return sendErrorResponse(res, 404, logger, {
      message: "Campaign not found!",
      doc: null,
    });
  }

  if (campaign.status === "sent") {
    return sendErrorResponse(res, 422, logger, {
      message: "Campaign already sent",
      doc: null,
    });
  }

  let customers = [];

  if (campaign.audienceType === "all") {
    customers = await Customer.find({
    //   isDeleted: false,
      status: { $ne: "deleted" },
    }).select("name username email phone phoneNumber phoneNumber2 whatsappNumber whatsappNumber2");
  } else {
    customers = await Customer.find({
      _id: { $in: campaign.customers || [] },
    //   isDeleted: false,
      status: { $ne: "deleted" },
    }).select("name username email phone phoneNumber phoneNumber2 whatsappNumber whatsappNumber2");
  }

  console.log("Customers to send campaign to:", customers.length);
  console.log("Customers to send campaign to:", customers[0]);

  const sendResult = await sendBroadcastDirect({
    customers,
    campaign,
  });

  campaign.status = "sent";
  campaign.sentAt = new Date();
  await campaign.save();

  return sendSuccessResponse(res, 200, logger, {
    message: "Broadcast campaign sent successfully",
    doc: campaign,
    sendResult,
  });
});

exports.delete = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendErrorResponse(res, 422, logger, {
      message: "Invalid campaign ID!",
      doc: null,
    });
  }

  const campaign = await BroadcastCampaign.findById(req.params.id);
  if (!campaign) {
    return sendErrorResponse(res, 404, logger, {
      message: "Campaign not found!",
      doc: null,
    });
  }

  if (campaign.status === "sent") {
    return sendErrorResponse(res, 422, logger, {
      message: "Sent campaign cannot be deleted",
      doc: null,
    });
  }

  await BroadcastCampaign.findByIdAndDelete(req.params.id);

  return sendSuccessResponse(res, 200, logger, {
    message: "Broadcast campaign deleted successfully",
    doc: null,
  });
});