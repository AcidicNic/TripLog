const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    content: { type: String, required: true },
    type: { type: String },
    edits: [ { type: String } ],
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
