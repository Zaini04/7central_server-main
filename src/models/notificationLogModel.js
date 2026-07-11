// src/models/notificationLogModel.js
const { required } = require("joi");
const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
      default: null,
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      default: null,
      index: true,
    },
    installment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Installment",
      default: null,
      index: true,
    },
    inventory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
        default: null,
        index: true,
    },
    paymentReceipt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
      index: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationTemplate",
    //   required: true,
      index: true,
            default: null,


    },
    channel: {
      type: String,
      enum: ["email", "sms", "whatsapp"],
      required: true,
    },
    templateKey: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    recipient: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    meta: {
      type: Object,
      default: {},
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// prevent duplicate installment reminder per channel/template
notificationLogSchema.index(
  { installment: 1, template: 1, channel: 1 },
//   { unique: true, partialFilterExpression: { installment: { $type: "objectId" } } }
);

const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);
module.exports = NotificationLog;