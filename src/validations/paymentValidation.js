const Joi = require('joi');
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const money = Joi.number().positive().precision(2);
const isoDate = Joi.date().iso();

// payment part schema
const paymentPartSchema = Joi.object({
  method: Joi.string().valid('online_transfer','cheque','cheque1','cheque2','cheque3','pay_order','cash','other').required().messages({
    'any.required': 'Payment method is required.',
    'string.base': 'Payment method must be a string.',
    'any.only': 'Payment method must be one of: online_transfer, cheque, cheque1, cheque2, cheque3, pay_order, cash, other.'
  }),
  amount: money.required().messages({
    'any.required': 'Payment amount is required.',
    'number.base': 'Payment amount must be a number.',
    'number.positive': 'Payment amount must be greater than 0.'
  }),
  paidAt: isoDate.required().messages({
    'any.required': 'Payment date is required.',
    'date.base': 'Payment date must be a valid date.',
    'date.format': 'Payment date must be in ISO format.'
  }),
  other: Joi.string().optional().allow(null,'').messages({
    "string.base": "Other must be a string.",
  }),
  // method-specific reference (free-form)
  reference: Joi.string().trim().allow('', null).messages({
    'string.base': 'Payment reference must be a string.'
  })
});

// main create schema
const createPaymentSchema = Joi.object({
  installment: objectId.optional().allow(null).messages({
    'any.required': 'Installment ID is required.',
    'string.base': 'Installment ID must be a string.',
  }),
  inventory: objectId.optional().allow(null).messages({
    'any.required': 'Installment ID is required.',
    'string.base': 'Installment ID must be a string.',
  }),

  totalAmount: money.optional().allow(0,null).messages({
    'any.required': 'Total payment amount is required.',
    'number.base': 'Total payment amount must be a number.',
    'number.positive': 'Total payment amount must be greater than 0.',
    'any.custom': 'Total payment amount does not match sum of parts.'
  }),
  receiptNo:   Joi.string().optional().allow('', null).messages({
    'string.base': 'Receipt number must be a string.'
  }),
  parts:       Joi.array().items(paymentPartSchema).min(1).required().messages({
    'array.min': 'At least one payment part is required.',
    'any.required': 'Payment parts are required.'
  }),


  notes:       Joi.string().trim().allow('', null).messages({
    'string.base': 'Notes must be a string.'
  }),
  files:       Joi.array().items(Joi.string().trim()).default([]).messages({
    'array.base': 'Files must be an array of strings.'
  })
})
.custom((value, helpers) => {
  // 1) Check totalAmount equals sum(parts.amount)
  const sum = (value.parts || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const diff = Math.abs(Number(value.totalAmount || 0) - sum);

  if (diff > 0.01) {
    return helpers.error('any.custom', { 
      message: `total amount (${value.totalAmount}) not equal to the sum of all partial amounts (${sum})`
    });
  }

  // ⚠ if you removed paidAt from schema, DO NOT use value.paidAt here
  // just remove this block entirely:
  //
  // const earliest = new Date(Math.min(...value.parts.map(p => new Date(p.paidAt).getTime())));
  // const bodyPaidAt = new Date(value.paidAt);
  // if (Math.abs(earliest.getTime() - bodyPaidAt.getTime()) > 1000) {
  //   return helpers.error('any.custom', { message: `paidAt should equal earliest parts[].paidAt (${earliest.toISOString()})` });
  // }

  return value;
}, 'Payment integrity checks')
.messages({
  'any.custom': '{{#message}}'
});

// partial update schema (e.g., for notes/files/receiptNo edits only)
const updatePaymentSchema = Joi.object({
  receiptNo: Joi.string().trim().allow('', null),
  notes:     Joi.string().trim().allow('', null),
  files:     Joi.array().items(Joi.string().trim()),
}).min(1);

const verifyPaymentSchema = Joi.object({
  payment:objectId.required().messages({
    'any.required': 'Payment ID is required.',
    'string.base': 'Payment ID must be a string.',
  }),
  approve : Joi.bool().allow('', null),
  notes:     Joi.string().trim().allow('', null),
  files:     Joi.array().items(Joi.string().trim()),
}).min(1);

module.exports = {
  createPaymentSchema,
  updatePaymentSchema,verifyPaymentSchema
};