const mongoose = require("mongoose");

const broadcastCampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["news", "marketing", "alert"],
      required: true,
    },
    audienceType: {
      type: String,
      enum: ["all", "selected"],
      required: true,
    },
    customers: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "Customer",
         },
    ],
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
    emailEnabled: {
      type: Boolean,
      default: false,
    },
    smsEnabled: {
      type: Boolean,
      default: false,
    },
    whatsappEnabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "sent"],
      default: "draft",
    },
    sentAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

 const BroadcastCampaign = mongoose.model("BroadcastCampaign", broadcastCampaignSchema);

 module.exports = BroadcastCampaign;