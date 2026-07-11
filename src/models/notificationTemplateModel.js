const mongoose = require("mongoose");

const notificationTemplateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "payment_confirmation",
        "before_due_reminder",
        "due_date_reminder",
        "overdue_reminder",
        "news",
        "marketing",
        "alert",
      ],
      required: true,
      index: true,
    },

    emailEnabled: {
      type: Boolean,
      default: true,
    },
    smsEnabled: {
      type: Boolean,
      default: true,
    },
    whatsappEnabled: {
      type: Boolean,
      default: true,
    },

    emailSubject: {
      type: String,
      default: "",
    },
    emailBody: {
      type: String,
      default: "",
    },
    smsBody: {
      type: String,
      default: "",
    },
    whatsappBody: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

const NotificationTemplate = mongoose.model(
  "NotificationTemplate",
  notificationTemplateSchema
);

module.exports = NotificationTemplate;