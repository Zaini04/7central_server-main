const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const logger = require("../logger/index.js")("NOTIFICATION_LOG_CONTROLLER");
const {
  sendSuccessResponse,
} = require("../utils/helpers");

const NotificationLog = require("../models/notificationLogModel");

exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;

  const queryFilterDoc = {};

  if (req.query.channel) queryFilterDoc.channel = req.query.channel;
  if (req.query.status) queryFilterDoc.status = req.query.status;
  if (req.query.templateKey) queryFilterDoc.templateKey = req.query.templateKey;
  if (req.query.userId) queryFilterDoc.user = req.query.userId;
  if (req.query.installmentId) queryFilterDoc.installment = req.query.installmentId;

  const docs = await NotificationLog.find(queryFilterDoc)
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .sort({ createdAt: -1 })
    .populate([
      { path: "customer", select: "name username email phone" },
      { path: "sale" },
      { path: "inventory" },
      { path: "installment" },
      { path: "paymentReceipt" },
    ]);

  const docsCount = await NotificationLog.countDocuments(queryFilterDoc);
  const pages = Math.ceil(docsCount / pageSize);

  return sendSuccessResponse(res, 200, logger, {
    message: "Notification logs fetched successfully",
    docs,
    docsCount,
    pages,
    page,
    pageSize,
  });
});