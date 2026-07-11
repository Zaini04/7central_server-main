const mongoose = require('mongoose');
const {DOCUMENT_TYPES, DOCUMENT_ASSIGN_TYPES } = require('../constants/app.constants');
const Schema = mongoose.Schema;

const documentSchema = new Schema({
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
        required: function() {
                return this.assignType === 'customer';
            } ,
      index: true,
    },
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
        required: function() {
                return this.assignType === 'inventory';
            } ,
      index: true,
    },
    
     type: {
      type: String,
      enum: [...DOCUMENT_TYPES],
      required: [true, "Document type is required."],
      index: true,

    },
    assignType:{
      type: String,
      enum: [...DOCUMENT_ASSIGN_TYPES],
      required: [true, "Assign type is required."],
      index: true,
    },
    name: {
        type: String,
        required: true
    }, 
   attachments: {
    type: [
      {
        fileUrl: { type: String, required: true }, // file path or URL
        tags: {
          type: [String],
          default: [],
        }
      }
    ],
    validate: {
      validator: function (v) {
        return v && v.length >= 1; // must have at least one attachment
      },
      message: "At least one attachment is required."
    }
  },
  

 createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
 other: { 
    type: String, 
    default: "" 
  },
       status : {
        type : String ,
        enum : ['not_assigned' , 'assigned' ,'blocked' , 'deleted'] ,  
        default : 'assigned' ,
        index: true

    } ,

} , { timestamps : true });

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;