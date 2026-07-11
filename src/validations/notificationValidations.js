const Joi = require('joi');

const notificationSchema = Joi.object({
    title: Joi.string().required().messages({
        'string.base': 'Title must be a string',
        'any.required': 'Title is required'
    }),
    body: Joi.string().required().messages({
        'string.base': 'Body must be a string',
        'any.required': 'Body is required'
    }),
    type: Joi.string().valid('all', 'specific').required().messages({
        'string.base': 'Type must be a string',
        'any.only': 'Type must be either "all" or "specific"',
        'any.required': 'Type is required'
    }),
    user: Joi.when('type', {
        is: 'specific',
        then: Joi.string().required().messages({
            'string.base': 'User must be a valid Mongo ID',
            'any.required': 'User is required for specific notifications'
        }),
        otherwise: Joi.string().optional().allow(null)
    })
});

module.exports = notificationSchema;
