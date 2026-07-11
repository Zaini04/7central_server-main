const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const logger = require("../logger/index.js")("NOTIFICATION_TEMPLATE_CONTROLLER");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/helpers");

const NotificationTemplate = require("../models/notificationTemplateModel");

const {
  createNotificationTemplateJoiSchema,
  updateNotificationTemplateJoiSchema,
  getNotificationTemplatesJoiSchema,
} = require("../validations/notificationTemplateValidation");

exports.create = catchAsync(async (req, res, next) => {
  const { value: validData, error } =
    createNotificationTemplateJoiSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const existing = await NotificationTemplate.findOne({ key: validData.key });
  if (existing) {
    return sendErrorResponse(res, 422, logger, {
      message: "Template key already exists",
      doc: null,
    });
  }

  const doc = await NotificationTemplate.create(validData);

  return sendSuccessResponse(res, 201, logger, {
    message: "Notification template created successfully",
    doc,
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  const { value: validData, error } =
    getNotificationTemplatesJoiSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const page = parseInt(validData.page) || 1;
  const pageSize = parseInt(validData.pageSize) || 20;

  const queryFilterDoc = {};

  if (validData.category) queryFilterDoc.category = validData.category;
  if (typeof validData.isActive === "boolean")
    queryFilterDoc.isActive = validData.isActive;
  if (validData.key) queryFilterDoc.key = validData.key;

  const docs = await NotificationTemplate.find(queryFilterDoc)
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .sort({ createdAt: -1 });

  const docsCount = await NotificationTemplate.countDocuments(queryFilterDoc);
  const pages = Math.ceil(docsCount / pageSize);

  return sendSuccessResponse(res, 200, logger, {
    message: "Notification templates fetched successfully",
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
      message: "Invalid template ID!",
      doc: null,
    });
  }

  const doc = await NotificationTemplate.findById(req.params.id);
  if (!doc) {
    return sendErrorResponse(res, 404, logger, {
      message: "Template not found!",
      doc: null,
    });
  }

  return sendSuccessResponse(res, 200, logger, {
    message: "Notification template fetched successfully",
    doc,
  });
});

exports.update = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendErrorResponse(res, 422, logger, {
      message: "Invalid template ID!",
      doc: null,
    });
  }

  const { value: validData, error } =
    updateNotificationTemplateJoiSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  if (validData.key) {
    const existing = await NotificationTemplate.findOne({
      key: validData.key,
      _id: { $ne: req.params.id },
    });
    if (existing) {
      return sendErrorResponse(res, 422, logger, {
        message: "Template key already exists",
        doc: null,
      });
    }
  }

  const doc = await NotificationTemplate.findByIdAndUpdate(
    req.params.id,
    validData,
    { new: true, runValidators: true }
  );

  if (!doc) {
    return sendErrorResponse(res, 404, logger, {
      message: "Template not found!",
      doc: null,
    });
  }

  return sendSuccessResponse(res, 200, logger, {
    message: "Notification template updated successfully",
    doc,
  });
});

exports.delete = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendErrorResponse(res, 422, logger, {
      message: "Invalid template ID!",
      doc: null,
    });
  }

  const doc = await NotificationTemplate.findByIdAndDelete(req.params.id);

  if (!doc) {
    return sendErrorResponse(res, 404, logger, {
      message: "Template not found!",
      doc: null,
    });
  }

  return sendSuccessResponse(res, 200, logger, {
    message: "Notification template deleted successfully",
    doc: null,
  });
});