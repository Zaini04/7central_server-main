const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username : {
        type : String ,
        trim : true ,
        index : true ,
        unique : true ,
        required : [true , 'username is required.']
    } ,
    email : {
        type : String ,
        trim : true , 
        unique : true , 
        index : true ,
        required : [true , 'Email is required.']
    } ,
   
    image : {
        type : String ,
        default : null
    } ,
    gender : {
        type : String ,
    } ,
    country : {
        type : String ,
    } ,
    dateOfBirth : {
        type : String ,
    } ,
    password : {
        type : String ,
        default : null
    } ,
   
    role : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Role'
    } ,
    isSuperAdmin : {
        type : Boolean ,
        default : false 
    } ,
    status : {
        type : String ,
        enum : ['active' , 'blocked' , 'deleted'] , 
        default : 'active' 
    } ,
    accountType : {
        type : String ,
        enum: ["password", "google", "apple"],
        default: 'password'
    } ,
   
    blockReason : {
        type : String ,
    } ,
   
    fcm_token : {
        type : String ,
        default : ''
    } , 
    // createdBy: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'User',
    //         required: function() {
    //             return this.isSuperAdmin === false;
    //         } 
    // },

} , { timestamps : true });


UserSchema.pre('save' , async function(next) {
    if(!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password , 10);
    next();
});

UserSchema.methods.comparePassword = async function (givenPassword) {
    return await bcrypt.compare(givenPassword , this.password)
}


const User = mongoose.model('User' , UserSchema);
module.exports = User;