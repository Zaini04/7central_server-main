const mongoose = require('mongoose');
const { INVENTORY_TYPES } = require('../constants/app.constants');
const Schema = mongoose.Schema;

const ownershipHistorySchema = new Schema({
  inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  oldSale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  newSale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
    previousBuyers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    }],
    newBuyers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    }],

  transferDate: { type: Date, default: Date.now },
  remarks: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const OwnerShipHistory = mongoose.model('OwnerShipHistory', ownershipHistorySchema);
module.exports = OwnerShipHistory;