// src/services/notificationService.js
const NotificationTemplate = require("../../models/notificationTemplateModel");
const NotificationLog = require("../../models/notificationLogModel");
const { replacePlaceholders } = require("./templateRenderer");
const NotificationSetting = require("../../models/notificationSettingModel");

// assume these already exist
const sendEmail = require("../mails/sendEmail");
const sendSms = require("./sendSms");
const sendWhatsapp = require("./sendWhatsapp");

const sendReminderAlerts = async ({
  templateKey,
  customer,
  sale = null,
  installment = null,
  paymentReceipt = null,
  payload = {},
}) => {
  const template = await NotificationTemplate.findOne({
    key: templateKey,
    isActive: true,
  });

  if (!template) {
    return { success: false, message: `Template ${templateKey} not found` };
  }
  const settings = customer?._id
    ? await NotificationSetting.findOne({ customer: customer._id })
    : null;
  const logs = [];

  const channelConfigs = [
    {
      channel: "email",
      enabled:
        !!template.emailEnabled &&
        (settings ? !!settings.emailNotifications : true),
      recipient: customer?.email || "",
      subject: replacePlaceholders(template.emailSubject || "", payload),
      content: replacePlaceholders(template.emailBody || "", payload),
    },
    {
      channel: "sms",
      enabled:
        !!template.smsEnabled &&
        (settings ? !!settings.smsNotifications : false),
      recipient: customer?.phone || customer?.phoneNumber || "",
      subject: "",
      content: replacePlaceholders(template.smsBody || "", payload),
    },
    {
      channel: "whatsapp",
      enabled:
        !!template.whatsappEnabled &&
        (settings ? !!settings.whatsappNotifications : false),
      recipient: customer?.whatsappNumber || customer?.phoneNumber || "",
      subject: "",
      content: replacePlaceholders(template.whatsappBody || "", payload),
    },
  ];


  for (const item of channelConfigs) {
    if (!item.enabled || !item.recipient) continue;

      let logDoc = null;

    try {
      try {
        logDoc = await NotificationLog.create({
          customer: customer?._id || null,
          sale: sale?._id || null,
          installment: installment?._id || null,
          paymentReceipt: paymentReceipt?._id || null,
          template: template._id,
        templateKey: template.key,
          channel: item.channel,
          recipient: item.recipient,
          subject: item.subject,
          content: item.content,
          status: "pending",
          meta: payload,
        });
      } catch (logErr) {
        if (logErr?.code === 11000) {
          logs.push({
            channel: item.channel,
            status: "skipped_duplicate",
          });
          continue;
        }
        throw logErr;
      }

      if (item.channel === "email") {
        await sendEmail({
          to: item.recipient,
          subject: item.subject,
          html: item.content,
        });
      } else if (item.channel === "sms") {
        await sendSms({
          to: item.recipient,
          message: item.content,
        });
      } else if (item.channel === "whatsapp") {
        await sendWhatsapp({
          to: item.recipient,
          message: item.content,
        });
      }

      logDoc.status = "sent";
      logDoc.sentAt = new Date();
      await logDoc.save();

      logs.push({
        channel: item.channel,
        status: "sent",
      });
    } catch (err) {
      if (logDoc) {
        logDoc.status = "failed";
        logDoc.errorMessage = err?.message || "Unknown error";
        await logDoc.save();
      }

      logs.push({
        channel: item.channel,
        status: "failed",
        error: err?.message || "Unknown error",
      });
    }
  }

  return {
    success: true,
    logs,
  };
};

const sendBroadcastDirect = async ({
  customers = [],
  campaign,
}) => {
  const logs = [];

  for (const customer of customers) {
    const channels = [
      {
        channel: "email",
        enabled: !!campaign.emailEnabled,
        recipient: customer?.email || "",
        subject: campaign.emailSubject || "",
        content: campaign.emailBody || "",
      },
      {
        channel: "sms",
        enabled: !!campaign.smsEnabled,
        recipient: customer?.phoneNumber || customer?.phoneNumber2 || "",
        subject: "",
        content: campaign.smsBody || "",
      },
      {
        channel: "whatsapp",
        enabled: !!campaign.whatsappEnabled,
        recipient: customer?.whatsappNumber || customer?.whatsappNumber2 || "",
        subject: "",
        content: campaign.whatsappBody || "",
      },
    ];

    for (const item of channels) {
      if (!item.enabled || !item.recipient || !item.content) continue;

      let logDoc = null;

      try {
        logDoc = await NotificationLog.create({
          customer: customer?._id || null,
          templateKey: `broadcast:${campaign.title}`,
        //   template: campaign._id,
          channel: item.channel,
          recipient: item.recipient,
          subject: item.subject,
          content: item.content,
          status: "pending",
          meta: {
            broadcastCampaignId: campaign._id,
            category: campaign.category,
          },
        });

        if (item.channel === "email") {
          await sendEmail({
            to: item.recipient,
            subject: item.subject,
            html: item.content,
          });
        } else if (item.channel === "sms") {
          await sendSms({
            to: item.recipient,
            message: item.content,
          });
        } else if (item.channel === "whatsapp") {
          await sendWhatsapp({
            to: item.recipient,
            message: item.content,
          });
        }

        logDoc.status = "sent";
        logDoc.sentAt = new Date();
        await logDoc.save();

        logs.push({
          customer: customer._id,
          channel: item.channel,
          status: "sent",
        });
      } catch (err) {
        if (logDoc) {
          logDoc.status = "failed";
          logDoc.errorMessage = err?.message || "Unknown error";
          await logDoc.save();
        }

        logs.push({
          customer: customer._id,
          channel: item.channel,
          status: "failed",
          error: err?.message || "Unknown error",
        });
      }
    }
  }

  return {
    success: true,
    logs,
  };
};

module.exports = {
  sendReminderAlerts,
  sendBroadcastDirect
};