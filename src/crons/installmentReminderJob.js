const dayjs = require("dayjs");
const Installment = require("../models/installmentModel");
const { sendReminderAlerts } = require("../utils/reminders/sendReminderService");
const NotificationLog = require("../models/notificationLogModel");

const ACTIVE_INSTALLMENT_STATUSES = ["un-paid", "pertially_paid"];

const alreadySentToday = async ({ customerId, installmentId, templateKey }) => {
  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();

  const log = await NotificationLog.findOne({
    customer: customerId,
    installment: installmentId,
    templateKey,
    status: "sent",
    // createdAt: { $gte: start, $lte: end },
  }).lean();

  return !!log;
};

const processInstallments = async ({ dueDateFilter, templateKey }) => {
  const installments = await Installment.find({
    status: { $in: ACTIVE_INSTALLMENT_STATUSES },
    dueDate: dueDateFilter,
  }).populate([
    {
      path: "sale",
      populate: [
        { path: "buyers" },
        { path: "inventory" },
      ],
    },
    { path: "inventory" },
  ]);

  console.log(`Processing ${templateKey}: found ${installments.length} installments`);

  for (const installment of installments) {
    try {
      const sale = installment.sale || null;
      const inventory = installment.inventory || sale?.inventory || null;
      const buyers = sale?.buyers || [];

      if (!sale || !buyers.length) continue;

      const outstandingAmount =
        Number(installment.amount || 0) - Number(installment.paidAmount || 0);

      if (outstandingAmount <= 0) continue;

      for (const customer of buyers) {
        if (!customer) continue;

        const sent = await alreadySentToday({
          customerId: customer._id,
          installmentId: installment._id,
          templateKey,
        });

        if (sent) continue;
        await sendReminderAlerts({
          templateKey,
          customer,
          sale,
          installment,
          payload: {
            "Client Name":
              customer.name ||
              customer.fullName ||
              customer.username ||
              sale.buyersDisplayName ||
              "Client",

            "Amount": outstandingAmount,

            "Installment #":
              installment.type === "down_payment"
                ? "Down Payment"
                : installment.seq || "",
            "Installment/Down Payment":
              installment.type === "down_payment"
                ? "Down Payment"
                : installment.seq || "",

            "Inventory #":
              inventory?.unitNo ||
              inventory?.unitNumber ||
              inventory?.fullNumber ||
              inventory?.number ||
              inventory?.plotNo ||
              "",

            "Commercial/Residential":
              inventory?.type ||
              inventory?.category ||
              inventory?.propertyType ||
              "",

            "Due Date": dayjs(installment.dueDate).format("DD-MM-YYYY"),

            "Project":
              inventory?.project?.name ||
              inventory?.projectName ||
              "The Prestige",
          },
        });
      }
    } catch (error) {
      console.error(
        `Installment reminder failed for installment ${installment?._id}:`,
        error.message
      );
    }
  }
};

exports.processInstallmentReminders = async () => {
  try {
    const today = dayjs().startOf("day");

    // 3 days before due
    await processInstallments({
      dueDateFilter: {
        $gte: today.add(15, "day").startOf("day").toDate(),
        $lte: today.add(15, "day").endOf("day").toDate(),
      },
      templateKey: "before_due_reminder",
    });

    // due today
    await processInstallments({
      dueDateFilter: {
        $gte: today.startOf("day").toDate(),
        $lte: today.endOf("day").toDate(),
      },
      templateKey: "due_date_reminder",
    });

    // overdue by 5 days or more
    await processInstallments({
      dueDateFilter: {
        $lte: today.subtract(5, "day").endOf("day").toDate(),
      },
      templateKey: "overdue_reminder",
    });

    console.log("Installment reminder cron completed successfully.");
  } catch (error) {
    console.error("processInstallmentReminders cron failed:", error.message);
  }
};