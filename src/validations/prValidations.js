const Joi = require('joi');
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const money = Joi.number().positive().precision(2);
const isoDate = Joi.date().iso();

const createPRSchema = Joi.object({
  inventory: objectId.required().messages({
    'any.required': 'Inventory ID is required.',
    'string.base': 'Inventory ID must be a string.',
  }),
    bankName: Joi.string().required().messages({
        'string.base': 'Bank Name must be a string',
        'any.required': 'Bank Name is required'
    }),
    chequeNo: Joi.string().required().messages({
        'string.base': 'Cheque No must be a string',
        'any.required': 'Cheque No is required'
    }),
    chequeDate: isoDate.required().messages({
    'any.required': 'Cheque date is required.',
    'date.base': 'Cheque date must be a valid date.',
    'date.format': 'Cheque date must be in ISO format.'
  }),
    amount: money.required().messages({
        'number.base': 'amount must be a number',
        'any.required': 'Amount is required'
    }),
   notes:       Joi.string().trim().allow('', null).messages({
      'string.base': 'Notes must be a string.'
    }),
   reason:       Joi.string().trim().allow('', null).messages({
      'string.base': 'Notes must be a string.'
    }),
    files:       Joi.array().items(Joi.string().trim()).default([]).messages({
      'array.base': 'Files must be an array of strings.'
    }),
   
});

const bouncedPRSchema = Joi.object({
   reason:       Joi.string().trim().allow('', null).messages({
      'string.base': 'Notes must be a string.'
    }),
    files:       Joi.array().items(Joi.string().trim()).default([]).messages({
      'array.base': 'Files must be an array of strings.'
    }),
   
});

module.exports = {createPRSchema,bouncedPRSchema};
