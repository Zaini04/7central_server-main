const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sectorSchema = new Schema({
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
    project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
      },
       createdBy: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "User", 
          required: true ,
          index: true,
        },
       status : {
        type : String ,
        enum : ['active' , 'deactivate' , 'deleted'] , 
        default : 'active' ,
                index: true

    } ,

} , { timestamps : true });

const Sector = mongoose.model('Sector', sectorSchema);
module.exports = Sector;