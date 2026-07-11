const mongoose = require('mongoose');

const prSchema = new mongoose.Schema({
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
    index: true
  },

  sale: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'

  },

  buyers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],

  // Cheque details
  bankName: { type: String, default: ''},
  chequeNo: { type: String, required: true },
  chequeDate: { type: Date, required: true },

  amount: { type: Number, required: true, min: 1 },

  notes: { type: String },

  files: [{
    type: String,
    default: []
  }],

  status: {
    type: String,
    enum: ['pending_clearance', 'cleared', 'bounced', 'cancelled'],
    default: 'pending_clearance',
    index: true
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  clearedAt: Date,
  bouncedAt: Date

}, { timestamps: true });

const ProvisionalReceipt =  mongoose.model('ProvisionalReceipt', prSchema);
module.exports = ProvisionalReceipt;
