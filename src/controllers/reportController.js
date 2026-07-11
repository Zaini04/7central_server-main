// src/controllers/report.controller.js
const mongoose = require('mongoose');

const Inventory = require('../models/inventoryModel');
const Installment = require('../models/installmentModel');
const Payment = require('../models/paymentModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const { sendSuccessResponse } = require('../utils/helpers');
const reportValidationSchema = require('../validations/reportValidations');
const logger = require('../logger')('REPORT_CONTROLLER');

// helpers
function asObjectId(id) {
  if (!id) return null;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// end defaults to current date
function resolveRange({ start, end }) {
  const now = new Date();
  const from = toDateOrNull(start) || null;
  const to = toDateOrNull(end) || now;
  return { from, to };
}

exports.reporting = catchAsync(async (req, res, next) => {
  // Joi validation
  const { error } = reportValidationSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { type } = req.query;

  const { from, to } = resolveRange({
    start: req.query.start,
    end: req.query.end
  });

  const projectId = asObjectId(req.query.project);
  const sectorId = asObjectId(req.query.sector);
  const inventoryId = asObjectId(req.query.inventory);
  const method = (req.query.method || '').trim();

  /* ============================================================
     1) DUE INSTALLMENTS
  ============================================================ */
  if (type === 'due_installments') {
    const dueStatuses = ['un-paid', 'overdue', 'pertially_paid', 'defaulted'];

    const match = { status: { $in: dueStatuses } };

    if (from) match.dueDate = { $gte: from, $lte: to };
    else match.dueDate = { $lte: to };

    if (inventoryId) match.inventory = inventoryId;

    const pipeline = [
      { $match: match },

      {
        $lookup: {
          from: 'inventories',
          localField: 'inventory',
          foreignField: '_id',
          as: 'inventoryDoc'
        }
      },
      { $unwind: '$inventoryDoc' },

      ...(sectorId ? [{ $match: { 'inventoryDoc.sector': sectorId } }] : []),
      ...(projectId ? [{ $match: { 'inventoryDoc.project': projectId } }] : []),

      {
        $lookup: {
          from: 'sales',
          localField: 'sale',
          foreignField: '_id',
          as: 'saleDoc'
        }
      },
      { $unwind: { path: '$saleDoc', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          seq: 1,
          type: 1,
          dueDate: 1,
          amount: 1,
          status: 1,
          paidAt: 1,
          paidAmount: 1,

          inventory: '$inventoryDoc._id',
          inventoryFullNumber: '$inventoryDoc.fullNumber',
          inventoryStatus: '$inventoryDoc.status',
          sector: '$inventoryDoc.sector',
          project: '$inventoryDoc.project',

          sale: '$saleDoc._id',
          buyersDisplayName: '$saleDoc.buyersDisplayName'
        }
      },
      { $sort: { dueDate: 1 } }
    ];

    const docs = await Installment.aggregate(pipeline);

    const summary = docs.reduce(
      (acc, r) => {
        acc.count += 1;
        acc.totalAmount += Number(r.amount || 0);
        return acc;
      },
      {
        title: 'Due Installments',
         count: 0, totalAmount: 0 }
    );

    return sendSuccessResponse(res, 200, logger, {
      type,
      range: { from, to },
      filters: { project: projectId, sector: sectorId, inventory: inventoryId },
      summary,
      docs
    });
  }

  /* ============================================================
     2) SOLD INVENTORIES
  ============================================================ */
  if (type === 'sold_inventories') {
    const soldStatuses = ['assigned', 'full_paid', 'hand_over'];

    const match = { status: { $in: soldStatuses } };

    if (projectId) match.project = projectId;
    if (sectorId) match.sector = sectorId;
    if (inventoryId) match._id = inventoryId;

    const pipeline = [
      { $match: match },

      {
        $lookup: {
          from: 'sectors',
          localField: 'sector',
          foreignField: '_id',
          as: 'sectorDoc'
        }
      },
      { $unwind: { path: '$sectorDoc', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'sales',
          localField: 'currentSale',
          foreignField: '_id',
          as: 'saleDoc'
        }
      },
      { $unwind: { path: '$saleDoc', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          project: 1,
          sector: 1,
          sectorTitle: '$sectorDoc.title',

          status: 1,
          plotNumber: 1,
          number: 1,
          fullNumber: 1,
          street: 1,
          approximateSize: 1,
          significance: 1,
          actualPrice: 1,
          createdAt: 1,

          currentSale: '$saleDoc._id',
          buyersDisplayName: '$saleDoc.buyersDisplayName',
          sellingPrice: '$saleDoc.sellingPrice',
          paymentType: '$saleDoc.paymentType'
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    const docs = await Inventory.aggregate(pipeline);

    const summary = docs.reduce(
      (acc, r) => {
        acc.count += 1;
        acc.totalSellingPrice += Number(r.sellingPrice || 0);
        return acc;
      },
      {
        title: 'Sold Inventories',
        count: 0, totalSellingPrice: 0 }
    );

    return sendSuccessResponse(res, 200, logger, {
      type,
      filters: { project: projectId, sector: sectorId, inventory: inventoryId },
      summary,
      docs
    });
  }

  /* ============================================================
     3) PAYMENTS RECEIVED
  ============================================================ */
  if (type === 'payments_received') {
    const match = { status: 'approved' };

    if (from) match.paidAt = { $gte: from, $lte: to };
    else match.paidAt = { $lte: to };

    if (inventoryId) match.inventory = inventoryId;

    const pipeline = [
      { $match: match },

      {
        $lookup: {
          from: 'inventories',
          localField: 'inventory',
          foreignField: '_id',
          as: 'inventoryDoc'
        }
      },
      { $unwind: '$inventoryDoc' },

      ...(sectorId ? [{ $match: { 'inventoryDoc.sector': sectorId } }] : []),
      ...(projectId ? [{ $match: { 'inventoryDoc.project': projectId } }] : []),

      { $unwind: '$parts' },

      ...(method ? [{ $match: { 'parts.method': method } }] : []),

      {
        $group: {
          _id: '$parts.method',
          amountTotal: { $sum: '$parts.amount' },
          txIds: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          amountTotal: 1,
          paymentCount: { $size: '$txIds' }
        }
      },
      { $sort: { amountTotal: -1 } }
    ];

    const byMethod = await Payment.aggregate(pipeline);
const totalAmount = byMethod.reduce((s, r) => s + r.amountTotal, 0);
const otherAmount = byMethod.find(r => r.method === 'other')?.amountTotal ?? 0;
const netCashReceived = totalAmount - otherAmount;

return sendSuccessResponse(res, 200, logger, {
  type,
  range: { from, to },
  filters: { project: projectId, sector: sectorId, inventory: inventoryId, method: method || null },
  summary: { title: 'Payments Received', totalAmount, otherAmount, netCashReceived, byMethod }
});

  }

  /* ============================================================
     4) FUTURE CASH FLOW
  ============================================================ */
if (type === 'future_cash_flow') {
  const unpaidStatuses = ['un-paid', 'overdue', 'pertially_paid', 'defaulted'];

  const now = new Date();
  now.setHours(0, 0, 0, 0); // normalize to start of today

  const startForward = from ? new Date(from) : now;
  const endForward = to ? new Date(to) : null;

  // If from is before today, we split into:
  //   - overduePeriod: [from, today)   → "pending till today"
  //   - futurePeriod:  [today, to]     → "coming in future"
  const hasOverduePeriod = startForward < now;

  const match = {
    status: { $in: unpaidStatuses },
    dueDate: endForward
      ? { $gte: startForward, $lte: endForward }
      : { $gte: startForward }
  };

  if (inventoryId) match.inventory = inventoryId;

  const pipeline = [
    { $match: match },

    {
      $lookup: {
        from: 'inventories',
        localField: 'inventory',
        foreignField: '_id',
        as: 'inventoryDoc'
      }
    },
    { $unwind: '$inventoryDoc' },

    ...(sectorId  ? [{ $match: { 'inventoryDoc.sector':  sectorId  } }] : []),
    ...(projectId ? [{ $match: { 'inventoryDoc.project': projectId } }] : []),

    // Tag each installment as overdue (before today) or upcoming
    {
      $addFields: {
        isPastDue: { $lt: ['$dueDate', now] }
      }
    },

    {
      $facet: {
        // ── Overall totals ──────────────────────────────────────────
        overall: [
          {
            $group: {
              _id: null,
              totalComingAmount:        { $sum: '$amount' },
              totalInstallments:        { $sum: 1 },
              // pending = overdue slice only
              totalPendingAmountTillToday: {
                $sum: { $cond: ['$isPastDue', '$amount', 0] }
              },
              totalPendingInstallments: {
                $sum: { $cond: ['$isPastDue', 1, 0] }
              },
              // future = upcoming slice only
              totalFutureAmount: {
                $sum: { $cond: ['$isPastDue', 0, '$amount'] }
              },
              totalFutureInstallments: {
                $sum: { $cond: ['$isPastDue', 0, 1] }
              }
            }
          },
          {
            $project: {
              _id: 0,
              totalComingAmount: 1,
              totalInstallments: 1,
              totalPendingAmountTillToday: 1,
              totalPendingInstallments: 1,
              totalFutureAmount: 1,
              totalFutureInstallments: 1
            }
          }
        ],

        // ── By Inventory ────────────────────────────────────────────
        byInventory: [
          {
            $group: {
              _id: '$inventoryDoc._id',
              inventoryFullNumber: { $first: '$inventoryDoc.fullNumber' },
              inventoryStatus:     { $first: '$inventoryDoc.status' },
              sector:              { $first: '$inventoryDoc.sector' },
              project:             { $first: '$inventoryDoc.project' },
              totalComingAmount:   { $sum: '$amount' },
              totalInstallments:   { $sum: 1 },
              nextDueDate:         { $min: '$dueDate' },
              totalPendingAmountTillToday: {
                $sum: { $cond: ['$isPastDue', '$amount', 0] }
              },
              totalFutureAmount: {
                $sum: { $cond: ['$isPastDue', 0, '$amount'] }
              }
            }
          },
          { $sort: { totalComingAmount: -1 } }
        ],

        // ── By Sector ───────────────────────────────────────────────
        bySector: [
          {
            $group: {
              _id: '$inventoryDoc.sector',
              project:           { $first: '$inventoryDoc.project' },
              totalComingAmount: { $sum: '$amount' },
              totalInstallments: { $sum: 1 },
              nextDueDate:       { $min: '$dueDate' },
              totalPendingAmountTillToday: {
                $sum: { $cond: ['$isPastDue', '$amount', 0] }
              },
              totalFutureAmount: {
                $sum: { $cond: ['$isPastDue', 0, '$amount'] }
              }
            }
          },
          {
            $lookup: {
              from: 'sectors',
              localField: '_id',
              foreignField: '_id',
              as: 'sectorDoc'
            }
          },
          { $unwind: { path: '$sectorDoc', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              sector: '$_id',
              sectorTitle: '$sectorDoc.title',
              project: 1,
              totalComingAmount: 1,
              totalInstallments: 1,
              nextDueDate: 1,
              totalPendingAmountTillToday: 1,
              totalFutureAmount: 1
            }
          },
          { $sort: { totalComingAmount: -1 } }
        ]
      }
    }
  ];

  const result = await Installment.aggregate(pipeline);

  const overall = result?.[0]?.overall?.[0] || {
    title: 'Future Cash Flow',
    totalComingAmount: 0,
    totalInstallments: 0,
    totalPendingAmountTillToday: 0,
    totalPendingInstallments: 0,
    totalFutureAmount: 0,
    totalFutureInstallments: 0
  };

  return sendSuccessResponse(res, 200, logger, {
    type,
    range: { from: startForward, to: endForward },
    filters: { project: projectId, sector: sectorId, inventory: inventoryId },
    // flag so the client knows overdue data is present
    hasOverduePeriod,
    summary: overall,
    byInventory: result?.[0]?.byInventory || [],
    bySector:    result?.[0]?.bySector    || []
  });
}

  return next(new AppError('Invalid report type.', 400));
});
