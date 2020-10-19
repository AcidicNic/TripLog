const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DoseSchema = new Schema({
    drug: { type: String },
    prettyName: { type: String },
    dose: { type: String },
    unit: { type: String },
    createdAt: { type: String },
});

DoseSchema.pre("save", function(next) {
    const now = new Date();
    if (!this.createdAt) {
        this.createdAt = now;
    }
    next();
});

module.exports = mongoose.model("Dose", DoseSchema);
