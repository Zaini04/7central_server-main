const mongoose = require('mongoose');

const paymentPartSchema = new mongoose.Schema({
  method: { type: String, enum: ['online_transfer','cheque','cheque1','cheque2','cheque3','pay_order','cash','other'], required: true },
  amount: { type: Number, required: true, min: 1 },
  paidAt:  { type: Date, required: true },
   other: { 
    type: String, 
    default: "" 
  },
  // flexible references per method
  reference: String,     // online transfer ref
}, { _id: false });

const paymentSchema  = new mongoose.Schema({
    autoIncrementId: {
    type: Number,
    default: null,
  },
  longAutoIncrementId: {
    type: String,
    default: null,
  },
    sale:        { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
  installment: { type: mongoose.Schema.Types.ObjectId, ref: 'Installment', required: true, index: true },
  inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  
  // sum(parts.amount)
  totalAmount: { type: Number, required: true, min: 1 },
  // freeform counter/receipt no (system generated or branch code)
  receiptNo:   { type: String, index: true },
   // array of the split payments
  parts: { type: [paymentPartSchema], validate: v => v.length > 0 },

    // Verification workflow
  status: { type: String, enum: ['pending','approved','rejected','voided'], default: 'pending', index: true },
  verifyNotes: { type: String, default: "" },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,

  // denorm for easy reporting
  paidAt: { type: Date, required: true }, // earliest part date or "when finalized"
  autoAssign: { type: Boolean, default: false },


  mergedFrom: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: [] }],
  mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
  isMerged: { type: Boolean, default: false },
  mergeNotes: { type: String, default: "" },
  
  // audit
  notes: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , required: true},

  files: [{ type: String, default: [] }],


}, { timestamps: true });



const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;