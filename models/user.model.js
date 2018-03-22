var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt-nodejs");
var SALT_FACTOR = 10;
var crypto = require("crypto");

function isEmail(email) {
  // regex check for email
  return (
    email.length &&
    /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
      email
    )
  );
}

var default_token = "abracadabra";

crypto.randomBytes(48, function (err, buffer) {
  default_token = buffer.toString('hex')
})

const userSchema = new Schema({
  email: {
    type: String,
    validate: [isEmail, "Invalid Email Address"],
    unique: true
  },
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  vToken: {
    type: String,
    default: default_token
  }
});

// token valid for 6 hrs
// const vTokenSchema = new Schema({
//   _userId: { type: mongoose.Schema.Types.ObjectId, require: true, ref: "User"},
//   token: {type: String, required: true},
//   createdAt: {type: Date, required: true, default: Date.now, expires: 21600}
// });

const noop = function () { };

// hash password before saving
userSchema.pre("save", function (done) {
  const user = this;
  if (!user.isModified("password")) {
    return done();
  }
  bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
    if (err) {
      return done(err);
    }
    bcrypt.hash(user.password, salt, noop, function (err, hashedPassword) {
      if (err) {
        return done(err);
      }
      user.password = hashedPassword;
      // give email verification token
      user.vToken = default_token;
      done();
    });
  });
});

userSchema.methods.checkPassword = function (guess, done) {
  bcrypt.compare(guess, this.password, function (err, isMatch) {
    done(err, isMatch);
  });
};

userSchema.methods.verify = function (token) {
  if (this.vToken === token) {
    this.isVerified = true;
  }
  return this.isVerified;
};


const User = mongoose.model("User", userSchema);
module.exports = User;
