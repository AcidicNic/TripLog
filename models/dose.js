const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DoseSchema = new Schema({
    drug: { type: String },
    prettyName: { type: String },
    dose: { type: String },
    unit: { type: String },
    log: { type: Schema.Types.ObjectId, ref: 'Log' },
    createdAt: { type: String },
    info: {
        summary: { type: String },
        aliases: { type: String },
        avoid: { type: String },
        effects: { type: String },
        dose: { type: String },
        categories: { type: String },
        duration: { type: String },
        onset: { type: String },
        halfLife: { type: String },
        afterEffects: { type: String },
    }
});

DoseSchema.pre("save", function(next) {
    const now = new Date();
    if (!this.createdAt) {
        this.createdAt = now;
    }
    next();
});

module.exports = mongoose.model("Dose", DoseSchema);
