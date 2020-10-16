const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    logs: [ { type: Schema.Types.ObjectId, ref: 'logs' } ],
    name: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date },
});

UserSchema.pre("save", function(next) {
    const now = new Date();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }
    next();
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
