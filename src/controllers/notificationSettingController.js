const NotificationSetting = require('../models/notificationSettingModel');
const Customer = require('../models/customerModel');
const  notificationSettingValidationSchema  = require('../validations/notificationSettingValidations');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendSuccessResponse } = require('../utils/helpers');
const logger = require('../logger')('NOTIFICATION_SETTING_CONTROLLER');


exports.createOrUpdate = catchAsync(async (req, res, next) => {
  const { error } = notificationSettingValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { customer } = req.body;

  const existingCustomer = await Customer.findById(customer);
  if (!existingCustomer) {
    return next(new AppError('Customer not found.', 404));
  }

  // Upsert (create if not exists, update if exists)
  const updatedSetting = await NotificationSetting.findOneAndUpdate(
    { customer },
    { ...req.body },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  sendSuccessResponse(res, 200, logger, {
    message: 'Notification settings saved successfully.',
    doc: updatedSetting,
  });
});

exports.getByCustomer = catchAsync(async (req, res, next) => {
  const { customerId } = req.params;

  const setting = await NotificationSetting.findOne({ customer: customerId });
  if (!setting) {
    return next(new AppError('Notification settings not found for this customer.', 404));
  }

  sendSuccessResponse(res, 200, logger, {
    message: 'Notification settings fetched successfully.',
    doc: setting,
  });
});
