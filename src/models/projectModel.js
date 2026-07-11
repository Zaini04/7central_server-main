const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    title: {
        type: String,
        required: true
    },
    
     createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
      },
       status : {
        type : String ,
        enum : ['active' , 'deactivate' , 'deleted'] , 
        default : 'active' ,
                index: true

    } ,
} , { timestamps : true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;