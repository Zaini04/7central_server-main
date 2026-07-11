// src/models/InstallmentPlan.js
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true, unique: true },
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
    index: true
  },
    category: { type: String, required: true }, // e.g., "2 Years Plan"
    // what user selected in UI (for traceability & audit)
    fullPayment: {type:Number, default: 0},
    downPayment: {type:Number, default: 0},
    allocation: {type:Number, default: 0},
    confirmation: {type:Number, default: 0},
    possession: {type:Number, default: 0},

    quarterly: {
      count: Number,     // e.g., 8
      duration: String,  // 'Quarterly'
      amount: Number,    // 1,500,000
      startDate: Date,   // derived
    },
    monthly: {
      count: Number,     // e.g., 24
      duration: String,  // 'Monthly'
      amount: Number,    // 500,000
      startDate: Date,
    },
    balloon: {
      count: Number,     // e.g., 2
      duration: String,  // 'Half Yearly'
      amount: Number,    // 4,000,000
      startDate: Date,
    },
  totalScheduled: Number,      // sum of all installment amounts
  currency: { type: String, default: 'PKR' }
}, { timestamps: true });


const InstallmentPlan = mongoose.model('InstallmentPlan', planSchema);
module.exports = InstallmentPlan;