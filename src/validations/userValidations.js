const Joi = require('joi');

const userValidation = Joi.object({
    username: Joi.string()
        .trim()
        .pattern(/^[a-zA-Z0-9._-]{3,30}$/) // Allows alphanumeric, ".", "_", "-", 3-30 chars
        .required()
        .messages({
            'any.required': 'Username is required.',
            'string.empty': 'Username cannot be empty.',
            'string.pattern.base': 'Username must be 3-30 characters long and can only contain letters, numbers, dots, underscores, or dashes.',
        }),
    email: Joi.string().trim().required()
        .messages({
            'any.required': 'Email is required.',
            'string.empty': 'Email cannot be empty.',
        }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required.',
        'string.empty': 'Password cannot be empty.',
    }),
})

module.exports = userValidation;