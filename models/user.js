const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    logs: [ { type: Schema.Types.ObjectId, ref: 'User' } ],
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
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(user.password, salt, (err, hash) => {
      user.password = hash;
      next();
    });
  });
  return next();
});

// UserSchema.methods.comparePassword = function(password, done) {
//   bcrypt.compare(password, this.password, (err, isMatch) => {
//     done(err, isMatch);
//   });
// };

// UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
