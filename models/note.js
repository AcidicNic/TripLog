const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    content: { type: String, required: true },
    type: { type: String },
    edits: [ this ],
    createdAt: { type: Date },
    updatedAt: { type: Date },
});

NoteSchema.pre("save", function(next) {
    const now = new Date();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }
    next();
});

module.exports = mongoose.model("Note", NoteSchema);
