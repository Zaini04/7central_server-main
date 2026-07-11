const mongoose = require('mongoose');
const { INVENTORY_TYPES } = require('../constants/app.constants');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  autoIncrementId: {
    type: Number,
    default: null,
  },
  longAutoIncrementId: {
    type: String,
    default: null,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  sector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sector',
    required: true,
    index: true,
  },
  currentSale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },

  type: {
    type: String,
    enum: [...INVENTORY_TYPES],
    required: [true, "Inventory type is required."],
    index: true,
  },
  plotNumber: {
    type: String,
    required: true
  },
  number: { type: String, required: true },
  fullNumber: { type: String, required: true },
  street: { type: String, required: true },
  approximateSize: { type: String, required: true },
  significance: { type: String, required: true },

  actualPrice:  { type: Number,default: null },

  image: {
    type: String
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ['not_assigned', 'assigned', 'full_paid', 'blocked', 'deleted', 'hand_over', 'in_installment'],
    default: 'not_assigned',
    index: true

  },

}, { timestamps: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;