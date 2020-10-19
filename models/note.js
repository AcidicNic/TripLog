const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    content: { type: String, required: true },
    format: { type: String },
    edits: [ this ],
    log: { type: Schema.Types.ObjectId, ref: 'Log' },
    timestamp: { type: Date },
});

NoteSchema.pre("save", function(next) {
    const now = new Date();
    if (!this.timestamp) {
        this.timestamp = now;
    }
    if (!this.type) {
        this.type = 'str';
    }
    next();
});

module.exports = mongoose.model("Note", NoteSchema);
