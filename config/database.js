require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  // const uri = `mongodb://${process.env.DB_HOST}:27017/${process.env.DB_DATABASE}`;
  const uri = `${process.env.MONGO_URI}`;

  try {
    await mongoose.connect(uri);
    console.log("✅✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌❌ Failed to connect to MongoDB", error);
    process.exit(1);
  }
};

module.exports = connectDB;
