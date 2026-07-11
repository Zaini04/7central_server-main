const Joi = require("joi");

exports.createBroadcastCampaignJoiSchema = Joi.object({
  title: Joi.string().trim().required(),
  category: Joi.string().valid("news", "marketing", "alert").required(),
  audienceType: Joi.string().valid("all", "selected").required(),
  customers: Joi.when("audienceType", {
    is: "selected",
    then: Joi.array().items(Joi.string().required()).min(1).required(),
    otherwise: Joi.array().items(Joi.string()).optional(),
  }),

  emailEnabled: Joi.boolean().optional(),
  smsEnabled: Joi.boolean().optional(),
  whatsappEnabled: Joi.boolean().optional(),

  emailSubject: Joi.string().allow("").optional(),
  emailBody: Joi.string().allow("").optional(),
  smsBody: Joi.string().allow("").optional(),
  whatsappBody: Joi.string().allow("").optional(),
});

exports.updateBroadcastCampaignJoiSchema = Joi.object({
  title: Joi.string().trim().optional(),
  category: Joi.string().valid("news", "marketing", "alert").optional(),
  audienceType: Joi.string().valid("all", "selected").optional(),
  customers: Joi.array().items(Joi.string()).optional(),

  emailEnabled: Joi.boolean().optional(),
  smsEnabled: Joi.boolean().optional(),
  whatsappEnabled: Joi.boolean().optional(),

  emailSubject: Joi.string().allow("").optional(),
  emailBody: Joi.string().allow("").optional(),
  smsBody: Joi.string().allow("").optional(),
  whatsappBody: Joi.string().allow("").optional(),
  status: Joi.string().valid("draft", "sent").optional(),
}).min(1);

exports.getBroadcastCampaignsJoiSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
  category: Joi.string().valid("news", "marketing", "alert").optional(),
  status: Joi.string().valid("draft", "sent").optional(),
});