// validators/installmentPlan.validator.js
const Joi = require('joi');

// Simple ObjectId validator (24 hex chars)
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const money = Joi.number().precision(2).positive();        // > 0, can hold decimals
const natInt = Joi.number().integer().min(1);               // natural integer (>=1)
const isoDate = Joi.date().iso();                           // expects ISO date strings

// ── Stream block schemas ────────────────────────────────────────────────────────
const quarterlySchema = Joi.object({
  count: natInt.required().messages({
    'any.required': 'Quarterly count is required.',
    'number.base': 'Quarterly count must be a number.',
    'number.min': 'Quarterly count must be at least 1.'
  }),
  duration: Joi.string().valid('Quarterly').required().messages({
    'any.required': 'Duration is required for quarterly stream.',
    'string.base': 'Duration must be a string.',
    'any.only': 'Duration must be "Quarterly".'
  }),
  amount: money.required().messages({
    'any.required': 'Quarterly amount is required.',
    'number.base': 'Quarterly amount must be a number.',
    'number.positive': 'Quarterly amount must be greater than 0.'
  }),
  startDate: isoDate.optional().messages({
    'date.base': 'Quarterly startDate must be a valid date.',
    'date.format': 'Quarterly startDate must be in ISO format.'
  })
});

const monthlySchema = Joi.object({
  count: natInt.required().messages({
    'any.required': 'Monthly count is required.',
    'number.base': 'Monthly count must be a number.',
    'number.min': 'Monthly count must be at least 1.'
  }),
  duration: Joi.string().valid('Monthly').required().messages({
    'any.required': 'Duration is required for monthly stream.',
    'string.base': 'Duration must be a string.',
    'any.only': 'Duration must be "Monthly".'
  }),
  amount: money.required().messages({
    'any.required': 'Monthly amount is required.',
    'number.base': 'Monthly amount must be a number.',
    'number.positive': 'Monthly amount must be greater than 0.'
  }),
  startDate: isoDate.optional().messages({
    'date.base': 'Monthly startDate must be a valid date.',
    'date.format': 'Monthly startDate must be in ISO format.'
  })});

const balloonSchema = Joi.object({
  count: natInt.required().messages({
    'any.required': 'Balloon count is required.',
    'number.base': 'Balloon count must be a number.',
    'number.min': 'Balloon count must be at least 1.'
  }),
  duration: Joi.string().valid('Half Yearly').required().messages({
    'any.required': 'Duration is required for balloon stream.',
    'string.base': 'Duration must be a string.',
    'any.only': 'Duration must be "Half Yearly".'
  }),
  amount: money.required(),
  startDate: isoDate.optional().messages({
    'date.base': 'Balloon startDate must be a valid date.',
    'date.format': 'Balloon startDate must be in ISO format.'
  })
});

const monthlyBalloonSchema = Joi.object({
  count: natInt.required().messages({
    'any.required': 'Monthly Balloon count is required.',
    'number.base': 'Monthly Balloon count must be a number.',
    'number.min': 'Monthly Balloon count must be at least 1.'
  }),
  duration: Joi.string().valid('Monthly + Half Yearly').required().messages({
    'any.required': 'Duration is required for monthly balloon stream.',
    'string.base': 'Duration must be a string.',
    'any.only': 'Duration must be "Monthly + Half Yearly".'
  }),
  amount: money.required(),
  startDate: isoDate.optional().messages({
    'date.base': 'Monthly Balloon startDate must be a valid date.',
    'date.format': 'Monthly Balloon startDate must be in ISO format.'
  })
});

// ── Main InstallmentPlan schema ────────────────────────────────────────────────
const installmentPlanSchema = Joi.object({
  sale: objectId.required().messages({
    'any.required': 'sale ID is required.',
    'string.base': 'sale ID must be a string.',
  }),
  inventory: objectId.required().messages({
    'any.required': 'Inventory ID is required.',
    'string.base': 'Inventory ID must be a string.',
  }),
 bookingDate: isoDate.optional().messages({
    'date.base': 'Balloon startDate must be a valid date.',
    'date.format': 'Balloon startDate must be in ISO format.'
  }),
  category: Joi.string().trim().min(1).required().messages({
    'any.required': 'category is required like full_payment or 1 year installments, 2 year installments etc.',
    'string.base': 'category must be a string.',
  }),

  // Milestones (all required and > 0)
  fullPayment: money.optional().messages({
    'number.base': 'Full payment must be a number.',
    'number.positive': 'Full payment must be greater than 0.'
  }),
  downPayment: money.optional().messages({
    'number.base': 'Down payment must be a number.',
    'number.positive': 'Down payment must be greater than 0.'
  }),
  allocation:  money.optional().allow(null,).messages({
    'number.base': 'Allocation must be a number.',
    'number.positive': 'Allocation must be greater than 0.'
  }),
  confirmation: money.optional().allow(null,).messages({
    'number.base': 'Confirmation must be a number.',
    'number.positive': 'Confirmation must be greater than 0.'
  }),
  possession:  money.optional().allow(null,).messages({
    'number.base': 'Possession must be a number.',
    'number.positive': 'Possession must be greater than 0.'
  }),

  // Streams are optional; if present they must be complete
  quarterly: quarterlySchema.optional().allow(null,).messages({
    'object.base': 'Quarterly installment block must be an object.'
  }),
  monthly:   monthlySchema.optional().allow(null,).messages({
    'object.base': 'Monthly installment block must be an object.'
  }),
  balloon:   balloonSchema.optional().allow(null,).messages({
    'object.base': 'Balloon installment block must be an object.'
  }),
  monthlyBalloon:   monthlyBalloonSchema.optional().allow(null,).messages({
    'object.base': 'Monthly Balloon installment block must be an object.'
  }),

  // totalScheduled: Joi.number().min(0).optional(),
  currency: Joi.string().trim().default('PKR')
})
// Cross-field custom check: if totalScheduled is provided, verify it matches sum
.custom((value, helpers) => {
  const {
    downPayment = 0,
    allocation = 0,
    confirmation = 0,
    possession = 0,
    quarterly,
    monthly,
    balloon,
    totalScheduled
  } = value;

  const sumStreams = (blk) => blk ? (blk.count * blk.amount) : 0;

  const computedTotal =
    downPayment +
    allocation  +
    confirmation +
    possession  +
    sumStreams(quarterly) +
    sumStreams(monthly) +
    sumStreams(balloon);

  // If client sent totalScheduled, ensure it's equal (tolerate tiny float diffs)
  if (typeof totalScheduled === 'number') {
    const diff = Math.abs(totalScheduled - computedTotal);
    if (diff > 0.01) {
      return helpers.error('any.custom', { message:
        `totalScheduled (${totalScheduled}) does not match computed total (${computedTotal})`
      });
    }
  }

  // Attach computed for downstream use (optional convenience)
  value._computedTotalScheduled = computedTotal;
  return value;
}, 'Total Scheduled cross-check');

module.exports = {
  installmentPlanSchema
};
