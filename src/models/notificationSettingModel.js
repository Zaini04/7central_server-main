const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSettingSchema = new Schema({
    customer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
          required: [true, "Customer is required."],
          index: true,
        },
    emailNotifications: {
        type: Boolean,
        default: true},
    pushNotifications: {
        type: Boolean,
        default: false},
    
    smsNotifications: {
        type: Boolean,
        default: false},
    whatsappNotifications: {
        type: Boolean,
        default: false},

} , { timestamps : true });

const NotificationSetting = mongoose.model('NotificationSetting', notificationSettingSchema);
module.exports = NotificationSetting;