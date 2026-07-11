const Joi = require('joi');

const arrObjectId = Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/));

const projectValidationSchema = Joi.object({

    title: Joi.string()
        .required()
        .messages({
            'any.required': 'Project title is required.',
            'string.base': 'Project title be a string.',
        }),



});

module.exports = projectValidationSchema;
