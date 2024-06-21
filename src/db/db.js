import mongoose from "mongoose";
import config from "../config/config.js";
const mongoUri = config.mongodb.uri || "mongodb://127.0.0.1:27017";
const dbName = config.mongodb.dbName || "DTSocial";

if (config.server.env === "dev") {
  mongoose.set("debug", true);
}

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  serverSelectionTimeoutMS: 5000,
  dbName,
};

export default async function () {
  try {
    await mongoose.connect(mongoUri, options);
    console.log(`MongoDB connected as ${mongoUri}`);
  } catch (e) {
    console.log("Error connecting to mongoose: ", e);
  }
}
