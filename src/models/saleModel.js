// src/models/Sale.js
const mongoose = require('mongoose');
const { SALE_STATUS, OWNERSHIP_TYPES, PAYMENT_TYPES } = require('../constants/app.constants');

const saleSchema = new mongoose.Schema({
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
    index: true
  },

  // List of buyers (single or joint)
  buyers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  }],

  // Combined name for display (e.g. "Ali + Ahmed + Sana")
  buyersDisplayName: { 
    type: String, 
    required: true 
  },

  sellingPrice: { type: Number, required: true },
  actualPrice:  { type: Number,default: null },

  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'InstallmentPlan' },
  onwershipType: {
    type: String,
    enum: [...OWNERSHIP_TYPES],
    required: [true, "Ownership type is required."],
    index: true,
    default:  function() {
                  return this.buyers.length > 1?'joint': 'self';
              } ,
  },
  paymentType: {
    type: String,
    enum: [...PAYMENT_TYPES],
    required: [true, "Payment type is required."],
    index: true,
  },

  status: { type: String, enum: SALE_STATUS, default: 'draft', index: true },
  transferredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
  transferredFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });


const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;