const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LogSchema = new Schema({
    title: { type: String },
    desc: { type: String },
    status: { type: Boolean, required: true },
    notes: [ { type: Schema.Types.ObjectId, ref: 'Note' } ],
    doses: [ { type: Schema.Types.ObjectId, ref: 'Dose' } ],
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date },
    updatedAt: { type: Date },
});

LogSchema.pre("save", function(next) {
    const now = new Date();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }
    if (!this.title) {
        this.title = "A New Experience";
    }
    if (!this.desc) {
        this.desc = "Click to edit!";
    }
    next();
});

module.exports = mongoose.model("Log", LogSchema);
