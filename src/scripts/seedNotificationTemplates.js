require("dotenv").config();
const mongoose = require("mongoose");
const NotificationTemplate = require("../models/notificationTemplateModel");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const MONGO_URI = process.env.DATABASE_URI || "";

const templates = [
  {
    key: "payment_confirmation",
    name: "Payment Confirmation",
    category: "payment_confirmation",
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    emailSubject: "Payment Confirmation – [Project]",
    emailBody: `
Dear Mr./Ms. [Client Name],

This is to formally acknowledge receipt of your payment of Rs. [Amount] against your [Installment/Down Payment] for:

Inventory No: [Inventory #]
Inventory Type: [Commercial/Residential]
Project: [Project]
Receipt No: [Receipt #]
Payment Date: [Date]

Your transaction has been successfully recorded in our system.

Should you require a detailed statement of account or any further assistance, please feel free to contact our office.

Thank you for your continued trust in [Project].

Regards,
Accounts Department
[Project]
    `.trim(),
    smsBody: `[Project] confirms that Rs. [Amount] against your [Installment/Down Payment] has been received.
Inventory #: [Inventory #] | Type: [Commercial/Residential]
Receipt #: [Receipt #] | Date: [Date]
Thank you for your valued association.`,
    whatsappBody: `[Project] confirms that Rs. [Amount] against your [Installment/Down Payment] has been received.
Inventory #: [Inventory #] | Type: [Commercial/Residential]
Receipt #: [Receipt #] | Date: [Date]
Thank you for your valued association.`,
    isActive: true,
  },
  {
    key: "before_due_reminder",
    name: "Before Due Reminder",
    category: "before_due_reminder",
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    emailSubject: "Installment Reminder – [Project]",
    emailBody: `
Dear Client,

This is a reminder that your installment of Rs. [Amount] for Inventory # [Inventory #] ([Commercial/Residential]) is due on [Due Date].

Kindly arrange payment to avoid late charges.
For assistance, please contact our accounts office.
    `.trim(),
    smsBody: `This is a reminder that your installment of Rs. [Amount] for Inventory # [Inventory #] ([Commercial/Residential]) is due on [Due Date].
Kindly arrange payment to avoid late charges.
For assistance, please contact our accounts office.`,
    whatsappBody: `This is a reminder that your installment of Rs. [Amount] for Inventory # [Inventory #] ([Commercial/Residential]) is due on [Due Date].
Kindly arrange payment to avoid late charges.
For assistance, please contact our accounts office.`,
    isActive: true,
  },
  {
    key: "due_date_reminder",
    name: "Due Date Reminder",
    category: "due_date_reminder",
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    emailSubject: "Payment Due Today – [Project]",
    emailBody: `
Dear Client,

This is a reminder that your installment of Rs. [Amount] for Inventory # [Inventory #] ([Commercial/Residential]) is due today.

Kindly arrange payment to avoid late charges.
For assistance, please contact our accounts office.
    `.trim(),
    smsBody: `Dear Client, your installment of Rs. [Amount] for Inventory # [Inventory #] ([Commercial/Residential]) is due today.
Kindly arrange payment to avoid late charges.`,
    whatsappBody: `Dear Client, your installment of Rs. [Amount] for Inventory # [Inventory #] ([Commercial/Residential]) is due today.
Kindly arrange payment to avoid late charges.`,
    isActive: true,
  },
  {
    key: "overdue_reminder",
    name: "Overdue Reminder",
    category: "overdue_reminder",
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    emailSubject: "Overdue Installment – [Project]",
    emailBody: `
Dear Client,

Your installment of Rs. [Amount] for Inventory # [Inventory #] ([Commercial/Residential]) is overdue.

Kindly deposit payment as soon as possible to avoid late charges.
If installment is paid, please ignore this message.
For assistance, please contact our accounts office.
    `.trim(),
    smsBody: `Dear Client,
Your installment of Rs. [Amount] for Inventory # [Inventory #] ([Commercial/Residential]) is overdue.
Kindly deposit payment as soon as possible to avoid late charges.
If installment is paid, please ignore this message.`,
    whatsappBody: `Dear Client,
Your installment of Rs. [Amount] for Inventory # [Inventory #] ([Commercial/Residential]) is overdue.
Kindly deposit payment as soon as possible to avoid late charges.
If installment is paid, please ignore this message.`,
    isActive: true,
  },
];

const run = async () => {
  await mongoose.connect(MONGO_URI);

  for (const item of templates) {
    await NotificationTemplate.findOneAndUpdate(
      { key: item.key },
      item,
      { upsert: true, new: true }
    );
  }

  console.log("Notification templates seeded successfully");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});