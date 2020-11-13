const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');
const crypto = require("crypto");

const Schema = mongoose.Schema;

const VerificationSchema = new Schema({
    code: { type: String, unique: true },
    email: { type: String, required: true },
});

VerificationSchema.pre("save", function(next) {
    if (!this.code) {
        this.code = crypto.randomBytes(25).toString('hex');
    }
    next();
});

module.exports = mongoose.model("Verify", VerificationSchema);
