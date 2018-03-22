const passport = require("passport");
const User = require("./models/user.model");
const LocalStrategy = require("passport-local").Strategy


passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use("login", new LocalStrategy({
  usernameField: "username",
  passwordField: "password"
},
  function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err) }
      if (!user) {
        return done(null, false, { message: "User name not found" })
      }
      if (!user.isVerified) {
        return done(null, false, { message: "User is not verified" })
      }
      user.checkPassword(password, function (err, isMatch) {
        if (err) { return done(err) }
        if (isMatch) {
          return done(null, user)
        } else {
          return done(null, false, { message: "Invalid Password" })
        }
      })
    })
  }))

module.exports = passport;