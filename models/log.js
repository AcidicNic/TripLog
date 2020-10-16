const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LogSchema = new Schema({
    title: { type: String, required: true },
    desc: { type: String, required: false },
    status: { type: Boolean, required: true },
    notes: [ { type: Schema.Types.ObjectId, ref: 'Note' } ],
    doses: [ { type: Schema.Types.ObjectId, ref: 'Dose' } ],
    createdAt: { type: Date },
    updatedAt: { type: Date },
});

LogSchema.pre("save", function(next) {
    const now = new Date();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }
    next();
});

module.exports = mongoose.model("Log", LogSchema);
