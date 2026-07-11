const Joi = require("joi");

exports.createNotificationTemplateJoiSchema = Joi.object({
  key: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  category: Joi.string()
    .valid(
      "payment_confirmation",
      "before_due_reminder",
      "due_date_reminder",
      "overdue_reminder",
      "news",
      "marketing",
      "alert"
    )
    .required(),

  emailEnabled: Joi.boolean().optional(),
  smsEnabled: Joi.boolean().optional(),
  whatsappEnabled: Joi.boolean().optional(),

  emailSubject: Joi.string().allow("").optional(),
  emailBody: Joi.string().allow("").optional(),
  smsBody: Joi.string().allow("").optional(),
  whatsappBody: Joi.string().allow("").optional(),

  description: Joi.string().allow("").optional(),
  isActive: Joi.boolean().optional(),
});

exports.updateNotificationTemplateJoiSchema = Joi.object({
  key: Joi.string().trim().optional(),
  name: Joi.string().trim().optional(),
  category: Joi.string()
    .valid(
      "payment_confirmation",
      "before_due_reminder",
      "due_date_reminder",
      "overdue_reminder",
      "news",
      "marketing",
      "alert"
    )
    .optional(),

  emailEnabled: Joi.boolean().optional(),
  smsEnabled: Joi.boolean().optional(),
  whatsappEnabled: Joi.boolean().optional(),

  emailSubject: Joi.string().allow("").optional(),
  emailBody: Joi.string().allow("").optional(),
  smsBody: Joi.string().allow("").optional(),
  whatsappBody: Joi.string().allow("").optional(),

  description: Joi.string().allow("").optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

exports.getNotificationTemplatesJoiSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
  category: Joi.string()
    .valid(
      "payment_confirmation",
      "before_due_reminder",
      "due_date_reminder",
      "overdue_reminder",
      "news",
      "marketing",
      "alert"
    )
    .optional(),
  isActive: Joi.boolean().optional(),
  key: Joi.string().optional(),
});