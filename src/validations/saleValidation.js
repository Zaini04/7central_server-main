const Joi = require("joi");
const {  INVENTORY_TYPES, PAYMENT_TYPES, OWNERSHIP_TYPES } = require("../constants/app.constants");
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const arrObjectId = Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/));


const saleValidationSchema = Joi.object({
  inventory: objectId.required().messages({
    'any.required': 'Inventory ID is required.',
    'string.base': 'Inventory ID must be a string.',
  }),
  buyers: arrObjectId.required().messages({
    'any.required': 'Customers Id is required.',
    'string.base': 'Customers ID must be a string.',
  }), 
   onwershipType:  Joi.string()
    .valid(...OWNERSHIP_TYPES)
    .required().messages({
      "any.required": "OWNERSHIP type is required.",
      "string.base": "OWNERSHIP type must be a string.",
      "any.only": `OWNERSHIP type must be one of: ${OWNERSHIP_TYPES.join(", ")}.`,
    }), 
   
   
  sellingPrice: Joi.number().optional().allow(null,0).messages({
    "any.required": "Selling Price is required.",
    "number.base": "Selling Price must be a Number."
  }),
  actualPrice: Joi.number().optional().allow(null,0).messages({
    "number.base": "Actual price must be a number."
  }),
  paymentType: Joi.string()
    .valid(...PAYMENT_TYPES)
    .required().messages({
      "any.required": "Payment type is required.",
      "string.base": "Payment type must be a string.",
      "any.only": `Payment type must be one of: ${PAYMENT_TYPES.join(", ")}.`,
    }),
});

const installmentPlanValidationSchema = Joi.object({
  sale: objectId.required().messages({
    'any.required': 'sale ID is required.',
    'string.base': 'sale ID must be a string.',
  }),
    inventory: objectId.required().messages({
    'any.required': 'Inventory ID is required.',
    'string.base': 'Inventory ID must be a string.',
  }),
  buyers: arrObjectId.required().messages({
    'any.required': 'Customers Id is required.',
    'string.base': 'Customers ID must be a string.',
  }), 
  sellingPrice: Joi.number().required().messages({
    "any.required": "Selling Price is required.",
    "number.base": "Selling Price must be a Number."
  }),
  actualPrice: Joi.number().optional().allow(null,0).messages({
    "number.base": "Actual price must be a number."
  }),
  category: Joi.string()
    .required().messages({
      "any.required": "category is required.",
      "string.base": "category must be a string.",
    }),
});


module.exports = {saleValidationSchema,installmentPlanValidationSchema};
