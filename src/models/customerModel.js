const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    name: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    email : {
        type : String ,
        trim : true , 
        unique : true , 
        index : true ,
        required : [true , 'Email is required.']
    } ,
    cnic: {
        type: String,
        required: true
    },
    passportName: {
        type: String,
        default: ""
    },
    phoneNumber: {
        type: String,
        required: true
    },
    phoneNumber2: {
        type: String,
        default: ""
    },
    whatsappNumber: {
        type: String,
        required: true
    },
    whatsappNumber2: {
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
        type : String,
        default: null,

    } ,
     createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
      },
       status : {
        type : String ,
        enum : ['not_assigned' , 'one_go_payment' , 'full_paid','default','blocked' , 'deleted','overdue','in_installment'] ,  
        default : 'not_assigned' ,
        index: true
    } ,

} , { timestamps : true });

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;