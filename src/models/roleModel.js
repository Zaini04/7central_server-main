const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  permissions: [
    {
        menu: { 
            type: String, 
            required: true 
        }, 
        // features: [String], // in case of complex role based auth , will add in future
    },
  ],
}, { timestamps: true });

const Role = mongoose.model('Role', RoleSchema);
module.exports = Role;