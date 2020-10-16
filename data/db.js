const mongoose = require("mongoose");
require('dotenv').config();
const assert = require("assert");

const url = process.env.MONGODB_URI || "mongodb://localhost/triplog-db";
mongoose.Promise = global.Promise;
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("error", console.error.bind(console, "MongoDB connection Error:"));
mongoose.set("debug", true);

module.exports = mongoose.connection;
