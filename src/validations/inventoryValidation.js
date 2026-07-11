const Joi = require("joi");
const {  INVENTORY_TYPES } = require("../constants/app.constants");
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const arrObjectId = Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/));

const inventoryValidationSchema = Joi.object({
  project: objectId.required().messages({
    'any.required': 'Project ID is required.',
    'string.base': 'Project ID must be a string.',
  }),
  sector: objectId.required().messages({
    'any.required': 'Sector ID is required.',
    'string.base': 'Sector ID must be a string.',
  }), 

  type: Joi.string()
    .valid(...INVENTORY_TYPES)
    .required()
    .messages({
      "any.required": "Inventory type is required.",
      "string.base": "Inventory type must be a string.",
      "any.only": `Inventory type must be one of: ${INVENTORY_TYPES.join(", ")}.`,
    }),
  plotNumber: Joi.string().required().messages({
    "any.required": "Plot number is required.",
    "string.base": "Plot number must be a string."
  }),

  number: Joi.string().required().messages({
    "any.required": "Number is required.",
    "string.base": "Number must be a string."
  }),

  fullNumber: Joi.string().required().messages({
    "any.required": "Full number is required.",
    "string.base": "Full number must be a string."
  }),

  street: Joi.string().required().messages({
    "any.required": "Street is required.",
    "string.base": "Street must be a string."
  }),

  approximateSize: Joi.string().required().messages({
    "any.required": "Approximate size is required.",
    "string.base": "Approximate size must be a string."
  }),

  significance: Joi.string().required().messages({
    "any.required": "Significance is required.",
    "string.base": "Significance must be a string."
  }),



});


module.exports = {inventoryValidationSchema};
