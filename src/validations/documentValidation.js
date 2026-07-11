const Joi = require("joi");
const { DOCUMENT_TYPES, DOCUMENT_ASSIGN_TYPES } = require("../constants/app.constants");
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const customerDocumentValidationSchema = Joi.object({
  customer: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
  }),

  type: Joi.string()
    .valid(...DOCUMENT_TYPES)
    .required()
    .messages({
      "any.required": "Document type is required.",
      "string.base": "Document type must be a string.",
      "any.only": `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}.`,
    }),


  name: Joi.string().required().messages({
    "any.required": "Document name is required.",
    "string.base": "Document name must be a string.",
  }),
  other: Joi.string().optional().allow(null,'').messages({
    "string.base": "Other must be a string.",
  }),
  // images:Joi.array().items(Joi.string()).optional(),
  // image:Joi.string().optional(),

  attachments: Joi.array()
    .items(
      Joi.object({
        fileUrl: Joi.string().required().messages({
          "any.required": "File URL is required in each attachment.",
          "string.base": "File URL must be a string.",
        }),
        tags: Joi.array().items(Joi.string()).default([]),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one attachment is required.",
      "any.required": "Attachments are required.",
    }),


});
const inventoryDocumentValidationSchema = Joi.object({
     customer: objectId.optional().allow(null,'').messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
  }),
  inventory: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
  }),

  type: Joi.string()
    .valid(...DOCUMENT_TYPES)
    .required()
    .messages({
      "any.required": "Document type is required.",
      "string.base": "Document type must be a string.",
      "any.only": `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}.`,
    }),


  name: Joi.string().required().messages({
    "any.required": "Document name is required.",
    "string.base": "Document name must be a string.",
  }),
  other: Joi.string().optional().allow(null,'').messages({
    "string.base": "Other must be a string.",
  }),
  attachments: Joi.array()
    .items(
      Joi.object({
        fileUrl: Joi.string().required().messages({
          "any.required": "File URL is required in each attachment.",
          "string.base": "File URL must be a string.",
        }),
        tags: Joi.array().items(Joi.string()).default([]),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one attachment is required.",
      "any.required": "Attachments are required.",
    }),


});
const updateDocumentValidationSchema = Joi.object({


  type: Joi.string()
    .valid(...DOCUMENT_TYPES)
    .optional()
    .allow(null)
    .messages({
      "any.required": "Document type is required.",
      "string.base": "Document type must be a string.",
      "any.only": `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}.`,
    }),


  name: Joi.string().optional().allow(null).messages({
    "any.required": "Document name is required.",
    "string.base": "Document name must be a string.",
  }),

  attachments: Joi.array()
    .items(
      Joi.object({
        fileUrl: Joi.string().optional().messages({
          "any.required": "File URL is required in each attachment.",
          "string.base": "File URL must be a string.",
        }),
        tags: Joi.array().items(Joi.string()).default([]),
      })
    )
    .optional().allow(null)
    .messages({
      "array.min": "At least one attachment is required.",
      "any.required": "Attachments are required.",
    }),

  other: Joi.string().optional().allow(null,'').messages({
    "string.base": "Other must be a string.",
  }),
});

module.exports = {customerDocumentValidationSchema, inventoryDocumentValidationSchema, updateDocumentValidationSchema};
