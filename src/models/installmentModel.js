const mongoose = require('mongoose');
const { INSTALLMENT_TYPE, INSTALLMENT_STATUS } = require('../constants/app.constants');

const installmentSchema = new mongoose.Schema({
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'InstallmentPlan', required: true, index: true },
  sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
  inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },

  seq:  { type: Number, required: true }, // 1..N visible to users
  type: { type: String, enum: INSTALLMENT_TYPE, required: true },

  dueDate: { type: Date, required: true, index: true },
  amount:  { type: Number, required: true },

  status:  { type: String, enum: INSTALLMENT_STATUS, default: 'un-paid', index: true },

  paidAt:   { type: Date, default:null, index: true },
  paidAmount: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // audit
  notes: String,
}, { timestamps: true });

// installmentSchema.index({ plan: 1, seq: 1 }, { unique: true });


const Installment = mongoose.model('Installment', installmentSchema);
module.exports = Installment;