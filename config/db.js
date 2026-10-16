const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  await mongoose.connect(db);
  console.log('MongoDB Connected...');
};

module.exports = connectDB;
