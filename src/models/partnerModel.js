const mongoose = require('mongoose');
const { CUSTOMER_PARTNER_TYPES, CUSTOMER_RELATION_TYPES } = require('../constants/app.constants');
const Schema = mongoose.Schema;

const partnerSchema = new Schema({
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
      required: [true, "Customer is required."],
      index: true,
    },
     type: {
      type: String,
      enum: [...CUSTOMER_PARTNER_TYPES],
      required: [true, "Partner  type is required."],
      index: true,

    },
    name: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    cnic: {
        type: String,
        required: true
    },
     relationType: {
      type: String,
      enum: [...CUSTOMER_RELATION_TYPES],
      default: null

    },
    email : {
        type : String ,
        trim : true , 
        default : "" ,
    } ,
    passportName: {
        type: String,
        default: ""
    },
    phoneNumber: {
        type: String,
        default: ""
    },
    houseFlatNumber:{
      type: String,
      default: null,
    },
    address:{
      type: String,
      default: null,
    },
    address2:{
      type: String,
      default: null,
    },
     city: {
      type: String,
      default: null,
    },
    province: {
      type: String,
      default: null,
    },
    countryCode: {
      // ISO 3166-1 alpha-2
      type: String,
      default: null,

    },
    countryName: {
      type: String,
      default: null,

    }, 
    image : {
        type : String 
    } ,
     createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
      },
       status : {
        type : String ,
        enum : ['not_assigned' , 'assigned' ,'blocked' , 'deleted'] ,  
        default : 'assigned' ,
                index: true

    } ,

} , { timestamps : true });

const Partner = mongoose.model('Partner', partnerSchema);
module.exports = Partner;