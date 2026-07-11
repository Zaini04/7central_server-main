
const Joi = require('joi');
const { CUSTOMER_RELATION_TYPES } = require('../constants/app.constants');
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const customerValidationSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Name is required.',
    'string.base': 'Name must be a string.',
  }),
  fatherName: Joi.string().required().messages({
    'any.required': 'Father name is required.',
    'string.base': 'Father name must be a string.',
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required.',
    'string.email': 'Please provide a valid email address.',
    'string.base': 'Email must be a string.',
  }),
  cnic: Joi.string().required().messages({
    'any.required': 'CNIC is required.',
    'string.base': 'CNIC must be a string.',
  }),
  passportName: Joi.string().allow(null,'').optional().messages({
    'string.base': 'Passport name must be a string.',
  }),
  phoneNumber: Joi.string().required().messages({
    'any.required': 'Primary phone number is required.',
    'string.base': 'Phone number must be a string.',
  }),
  phoneNumber2: Joi.string().allow(null,'').optional().messages({
    'string.base': 'Secondary phone number must be a string.',
  }),
  whatsappNumber: Joi.string().required().messages({
    'any.required': 'Primary WhatsApp number is required.',
    'string.base': 'WhatsApp number must be a string.',
  }),
  whatsappNumber2: Joi.string().allow(null,'').optional().messages({
    'string.base': 'Secondary WhatsApp number must be a string.',
  }),
  houseFlatNumber: Joi.string().allow(null, '').optional().messages({
    'string.base': 'House/Flat number must be a string.',
  }),
  address: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Address must be a string.',
  }),
  address2: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Address 2 must be a string.',
  }),
  city: Joi.string().allow(null, '').optional().messages({
    'string.base': 'City must be a string.',
  }),
  province: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Province must be a string.',
  }),
  countryCode: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Country code must be a string.',
  }),
  countryName: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Country name must be a string.',
  }),
image: Joi.string()
  .dataUri()
  .allow(null, "")   // allow empty or null
  .optional()
  .messages({
    "string.dataUri": "Invalid image format. Must be a valid Data URI.",
  }),
});


const partnerValidationSchema = Joi.object({
      customer: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
  }),
  name: Joi.string().required().messages({
    'any.required': 'Name is required.',
    'string.base': 'Name must be a string.',
  }),
  fatherName: Joi.string().required().messages({
    'any.required': 'Father/Husband name is required.',
    'string.base': 'Father/Husband name must be a string.',
  }),
  cnic: Joi.string().required().messages({
    'any.required': 'CNIC/NICOP number is required.',
    'string.base': 'CNIC must be a string.',
  }),
  relationType: Joi.string()
    .valid(...CUSTOMER_RELATION_TYPES).optional()
    .allow(null)
    .messages({
      'any.only': `Relation type must be one of: ${CUSTOMER_RELATION_TYPES.join(', ')}.`,
    }),
  email: Joi.string().email().allow(null,'').messages({
    'string.email': 'Please enter a valid email.',
  }),
  passportNumber: Joi.string().allow(null,'').messages({
    'string.base': 'Passport name must be a string.',
  }),
  phoneNumber: Joi.string().allow(null,'').messages({
    'string.base': 'Phone number must be a string.',
  }),
  houseFlatNumber: Joi.string().allow(null, '').messages({
    'string.base': 'House/Flat number must be a string.',
  }),
  address: Joi.string().allow(null, '').messages({
    'string.base': 'Address must be a string.',
  }),
  address2: Joi.string().allow(null, '').messages({
    'string.base': 'Address 2 must be a string.',
  }),
  city: Joi.string().allow(null, '').messages({
    'string.base': 'City must be a string.',
  }),
  province: Joi.string().allow(null, '').messages({
    'string.base': 'Province must be a string.',
  }),
  countryCode: Joi.string().allow(null, '').messages({
    'string.base': 'Country code must be a string.',
  }),
  countryName: Joi.string().allow(null, '').messages({
    'string.base': 'Country name must be a string.',
  }),
  country: Joi.string().allow(null, '').messages({
    'string.base': 'Country name must be a string.',
  }),
  // image: Joi.string().allow(null,'').messages({
  //   'string.base': 'Image must be a string.',
  // }),
  
});


module.exports = {customerValidationSchema,partnerValidationSchema};
