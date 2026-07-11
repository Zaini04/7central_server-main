const dayjs = require("dayjs");
const Sale = require("../../models/saleModel");
const Installment = require("../../models/installmentModel");
const Payment = require("../../models/paymentModel");
const { sendReminderAlerts } = require("./sendReminderService");

exports.sendPaymentConfirmationNotification = async ({
  paymentId = null,
  installmentId = null,
  saleId = null,
}) => {
  try {
    let paymentDoc = null;
    let installmentDoc = null;
    let saleDoc = null;

    if (paymentId) {
      paymentDoc = await Payment.findById(paymentId)
        .populate([
          { path: "sale", populate: [{ path: "buyers" }, { path: "inventory" }] },
          { path: "installment" },
          { path: "inventory" },
        ]);
    }

    if (!paymentDoc && installmentId) {
      installmentDoc = await Installment.findById(installmentId).populate("inventory");
    }

    if (paymentDoc?.sale) {
      saleDoc = paymentDoc.sale;
    } else if (saleId) {
      saleDoc = await Sale.findById(saleId).populate(["buyers", "inventory"]);
    } else if (installmentDoc?.sale) {
      saleDoc = await Sale.findById(installmentDoc.sale).populate(["buyers", "inventory"]);
    }

    if (!saleDoc) return;

    const buyers = saleDoc.buyers || [];
    if (!buyers.length) return;

    const inventory =
      paymentDoc?.inventory ||
      installmentDoc?.inventory ||
      saleDoc.inventory ||
      null;

    const amount =
      paymentDoc?.totalAmount ||
      installmentDoc?.paidAmount ||
      installmentDoc?.amount ||
      0;

    const installment =
      paymentDoc?.installment || installmentDoc || null;

    const payloadBase = {
      "Amount": amount,
      "Installment/Down Payment": installment
        ? installment.type === "down_payment"
          ? "Down Payment"
          : installment.seq
          ? `Installment #${installment.seq}`
          : "Installment"
        : "Payment",
      "Inventory #":
        inventory?.unitNo || inventory?.unitNumber || inventory?.plotNo || "",
      "Commercial/Residential":
        inventory?.type || inventory?.category || inventory?.propertyType || "",
      "Project":
        inventory?.project?.name || inventory?.projectName || "The Prestige",
      "Receipt #":
        paymentDoc?.receiptNo ||
        paymentDoc?.longAutoIncrementId ||
        paymentDoc?.autoIncrementId ||
        "",
        "Receipt ID": paymentDoc?._id ? paymentDoc._id.toString() : "",
      "Date": dayjs(
        paymentDoc?.paidAt ||
          installment?.paidAt ||
          paymentDoc?.createdAt ||
          new Date()
      ).format("DD-MM-YYYY"),
    };

    for (const buyer of buyers) {
      await sendReminderAlerts({
        templateKey: "payment_confirmation",
        user: buyer,
        sale: saleDoc,
        installment,
        payment: paymentDoc,
        payload: {
          "Client Name":
            buyer?.name ||
            buyer?.fullName ||
            buyer?.username ||
            saleDoc.buyersDisplayName ||
            "Client",
          ...payloadBase,
        },
      });
    }
  } catch (error) {
    console.error("Payment confirmation notification failed:", error);
  }
};