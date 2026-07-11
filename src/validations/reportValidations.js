const Joi = require('joi');
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

// allowed report types
const REPORT_TYPES = [
  'due_installments',
  'sold_inventories',
  'payments_received',
  'future_cash_flow'
];

// allowed payment methods (from your schema)
const PAYMENT_METHODS = [
  'online_transfer',
  'cheque',
  'pay_order',
  'cash',
  'cheque1',
  'cheque2',
  'cheque3',
  'other'
];

const reportValidationSchema = Joi.object({

  // which report to run
  type: Joi.string()
    .valid(...REPORT_TYPES)
    .required()
    .messages({
      'any.required': 'Report type is required.',
      'any.only': 'Invalid report type selected.'
    }),

  // date filters (optional)
  start: Joi.date()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date.'
    }),

  end: Joi.date()
    .optional()
    .messages({
      'date.base': 'End date must be a valid date.'
    }),

  // common optional filters
  project: objectId
    .optional()
    .messages({
      'string.pattern.base': 'Invalid project id.'
    }),

  sector: objectId
    .optional()
    .messages({
      'string.pattern.base': 'Invalid sector id.'
    }),

  inventory: objectId
    .optional()
    .messages({
      'string.pattern.base': 'Invalid inventory id.'
    }),

  // only used when type = payments_received
  method: Joi.when('type', {
    is: 'payments_received',
    then: Joi.string()
      .valid(...PAYMENT_METHODS)
      .optional()
      .messages({
        'any.only': 'Invalid payment method.'
      }),
    otherwise: Joi.forbidden()
  })

})
  // logical date validation
  .custom((value, helpers) => {
    if (value.start && value.end && new Date(value.start) > new Date(value.end)) {
      return helpers.message('Start date cannot be greater than end date.');
    }
    return value;
  });

module.exports = reportValidationSchema;
