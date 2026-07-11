// utils/installmentPlanBuilder.js
const dayjs = require("dayjs");

function addPeriod(date, duration) {
  const d = dayjs(date);

  switch (duration || "") {
    case "Monthly":
      return d.add(1, "month").toDate();
    case "Quarterly":
      return d.add(3, "month").toDate();
    case "Half Yearly":
      return d.add(6, "month").toDate();
    case "Monthly + Half Yearly":
      return d.add(6, "month").toDate();
    case "Yearly":
      return d.add(1, "year").toDate();
    default:
      return d.add(1, "month").toDate();
  }
}

function buildInstallmentRows({ value, sale, planId, userId }) {
  const rows = [];
  const monthMap = new Map();

  const today = value.bookingDate
    ? dayjs(value.bookingDate).startOf("day")
    : dayjs().startOf("day");

  const monthKey = (d) => dayjs(d).format("YYYY-MM");

  const push = (kind, dueDate, amount) => {
    if (!amount || amount <= 0 || !dueDate) return;

    let d = dayjs(dueDate).startOf("day");
    let safety = 0;

    while (safety++ < 2400) {
      const key = monthKey(d);

      if (!monthMap.has(key)) {
        monthMap.set(key, rows.length);
        rows.push({
          plan: planId,
          sale: sale._id,
          inventory: sale.inventory,
          type: kind,
          dueDate: d.toDate(),
          amount,
          status: "un-paid",
          paidAmount: 0,
          paidAt: null,
          createdBy: userId || null,
        });
        return;
      }

      d = d.add(1, "month");
    }

    throw new Error("Could not schedule installment without overlap");
  };

  // 1) Milestones
  if (value.fullPayment) {
    push("full_payment", today.toDate(), value.fullPayment);
  }

  if (value.downPayment) {
    push("down_payment", today.toDate(), value.downPayment);
  }

  if (value.allocation) {
    push("allocation", today.add(30, "day").toDate(), value.allocation);
  }

  if (value.confirmation) {
    push("confirmation", today.add(60, "day").toDate(), value.confirmation);
  }

  // 2) Balloon stream
  if (value.balloon?.count) {
    let d = value.balloon.startDate || today.add(6, "month").toDate();
    for (let i = 0; i < value.balloon.count; i++) {
      push("balloon", d, value.balloon.amount);
      d = addPeriod(d, value.balloon.duration);
    }
  }

  if (value.monthlyBalloon?.count) {
    let d = value.monthlyBalloon.startDate || today.add(6, "month").toDate();
    for (let i = 0; i < value.monthlyBalloon.count; i++) {
      push("monthly_balloon", d, value.monthlyBalloon.amount);
      d = addPeriod(d, value.monthlyBalloon.duration);
    }
  }

  // 3) Quarterly
  if (value.quarterly?.count) {
    let d = value.quarterly.startDate || today.add(3, "month").toDate();
    for (let i = 0; i < value.quarterly.count; i++) {
      push("quarterly", d, value.quarterly.amount);
      d = addPeriod(d, value.quarterly.duration);
    }
  }

  // 4) Monthly
  if (value.monthly?.count) {
    let d = value.monthly.startDate || today.add(1, "month").toDate();
    for (let i = 0; i < value.monthly.count; i++) {
      push("monthly", d, value.monthly.amount);
      d = addPeriod(d, value.monthly.duration);
    }
  }

  // 5) Possession
  if (value.possession && rows.length > 0) {
    const lastDate = rows.reduce(
      (max, r) => (r.dueDate > max ? r.dueDate : max),
      rows[0].dueDate
    );

    const possessionDate = dayjs(lastDate)
      .add(1, "month")
      .startOf("day")
      .toDate();

    rows.push({
      plan: planId,
      sale: sale._id,
      inventory: sale.inventory,
      type: "possession",
      dueDate: possessionDate,
      amount: value.possession,
      status: "un-paid",
      paidAmount: 0,
      paidAt: null,
      createdBy: userId || null,
    });
  }

  rows.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  let seq = 1;
  for (const row of rows) {
    row.seq = seq++;
  }

  return rows;
}

function applyPaidAmountFIFO(rows, totalPaid) {
  let remainingPaid = Number(totalPaid || 0);

  return rows.map((row) => {
    const cloned = { ...row };

    if (remainingPaid <= 0) {
      cloned.paidAmount = 0;
      cloned.status = "un-paid";
      cloned.paidAt = null;
      return cloned;
    }

    if (remainingPaid >= cloned.amount) {
      cloned.paidAmount = cloned.amount;
      cloned.status = "paid";
      remainingPaid -= cloned.amount;
      return cloned;
    }

    cloned.paidAmount = remainingPaid;
    cloned.status = "partially-paid"; // make sure this exists in your enum
    remainingPaid = 0;
    return cloned;
  });
}

module.exports = {
  buildInstallmentRows,
  applyPaidAmountFIFO,
};