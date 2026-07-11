const mongoose = require('mongoose');
const logger = require('../logger')('DATABASE')
// require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const DB = process.env.DATABASE_URI;

mongoose.set('strictQuery', false);

const connectDB = () => {
   mongoose.connect(DB)
   .then(() =>  {
      if(process.env.NODE_ENV === 'production') {
         return logger.info('Database connected.')
      }
      console.log('Database connected.')
   })
   .catch(err => logger.error(`Database connection failed. ${err}`))
}
async function getNextInSequence(name) {
  const updatedDocument = await mongoose.connection.db
    .collection("counters")
    .findOneAndUpdate(
      { _id: name },
      { $inc: { currentIDs: 1 } },
      { returnDocument: "after" },
    );
  return updatedDocument.currentIDs;
}

async function decreaseByOneInSequence(name) {
  const updatedDocument = await mongoose.connection.db
    .collection("counters")
    .findOneAndUpdate(
      { _id: name },
      { $inc: { currentIDs: -1 } },
      { returnDocument: "after" },
    );
  return updatedDocument.currentIDs;
}
module.exports =  {connectDB, getNextInSequence , decreaseByOneInSequence };