const mongoose = require('mongoose');
require('dotenv').config();
const db = process.env.MONGO_URI;

const connect = async () => {
  try {
    await mongoose.connect(db, { 
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log("MongoDB connected");
  } catch(err){
    console.error(err.message);
    //Exits process with failure
    process.exit(1);
  }
}

module.exports = connect;
