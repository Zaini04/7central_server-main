const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const sectorValidationSchema = Joi.object({

    title: Joi.string()
        .required()
        .messages({
            'any.required': 'Sector title is required.',
            'string.base': 'Sector title be a string.',
        }),
    project: objectId.required(),




});

module.exports = sectorValidationSchema;
