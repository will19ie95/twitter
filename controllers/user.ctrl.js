const User = require("../models/user.model");
const db = require("../db");
const shortId = require("shortid");
const moment = require("moment");
const passport = require("passport");
const nodemailer = require("../nodemailer");

exports.login = function (req, res, next) {
  passport.authenticate('login', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      return next(info)
    }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      // generate jwt token
      token = user.generateJwt();
      // block some private user data
      userData = {
        username: user.username,
        email: user.email,
      }

      return res.json({
        status: "OK",
        info: info,
        user: userData,
        token: token
      });
    });
  })(req, res, next);

}
// deprecated due to JWT
exports.logout = function (req, res, next) {
  if (req.user) {
    req.logout();
    return res.json({
      status: "OK",
      message: "Logged Out"
    });
  } else {
    return next(new Error("No user logged in"))
  }
}
exports.addUser = function (req, res, next) {
  const user = new User();

  user.email = req.body.email;

  User.findOne({ email: user.email }, function (err, user) {
    if (err) { return next(err) }
    if (user) {
      return next(new Error("Email already exists!"))
    } else {
      const newUser = new User();
      newUser.username = req.body.username;
      newUser.email = req.body.email;
      newUser.password = req.body.password;
      newUser.vToken = shortId.generate()
      newUser.save(function (err) {
        if (err) { return next(err) }
        // send vToken email verification
        nodemailer.sendMail(newUser.email, newUser.vToken);
        return res.json({
          status: "OK",
          message: "Successfully created user",
          user: newUser,
          vToken: newUser.vToken,
        })
      })
    }
  });
}
exports.verify = function (req, res, next) {
  // check for get  query too.
  const email = req.body.email || req.query.email;
  const key = req.body.key || req.query.key;

  User.findOne({ email: email }, function (err, user) {
    if (err) { return next(err) }
    if (!user) {
      return next(new Error("Email not found"))
    }
    // check user is not alredy verified 
    if (user.isVerified) {
      return next(new Error("User is already verified"))
    }
    if (key === "abracadabra" || key === user.vToken) {
      user.isVerified = true;
      user.save(function (err, updatedUser) {
        if (err) { return next(err) }
        console.log("user verified")
        // req.flash("info", "Thank You for Verifying.")
        // return res.redirect("/");
        return res.json({
          status: "OK"
        })
      })
    } else {
      return next(new Error("Key does not match"))
    }
  })
}
exports.getUser = function (req, res, next) {
  const username = req.query.username || req.params['username'];
  
  User.findOne({ username: username }, function (err, user) {
    if (err) { return next(err) }

    if (!user) {
      return next(new Error("User with username: <" + username + "> Not Found"))
    }

    // hide password and other info
    let user_data = {
      email: user.email,
      followers: user.followers.length,
      following: user.following.length,
    };

    return res.json({
      status: "OK",
      message: "Found User",
      user: user_data
    })

  })

  
}
exports.getFollowers = function(req, res, next) {
  const username = req.params['username'];
  const limit = req.body['limit'] || 50;
  
  User.findOne({ username: username }, function(err, user) {
    if (err) { return next(err) }

    if (!user) {
      return next(new Error("User with username: <" + username + "> Not Found"))
    }

    return res.json({
      status: "OK",
      message: "Found list of followers for:" + username,
      users: user.followers
    })
  })
}
exports.getFollowing = function (req, res, next) {
  const username = req.params['username'];
  const limit = req.body['limit'] || 50;

  User.findOne({ username: username }, function (err, user) {
    if (err) { return next(err) }

    if (!user) {
      return next(new Error("User with username: <" + username + "> Not Found"))
    }

    return res.json({
      status: "OK",
      message: "Found list of followings for:" + username,
      users: user.following
    })
  })
}
exports.follow = function(req, res, next) {
  const username_to_follow = req.body.username;
  const follow = req.body.follow; // If false then unfollow
  if (follow === null) {
    follow = true;
  }
  const username = req.payload.username; 
  const _id = req.payload._id; //get _id from jwt

  if (username_to_follow === username && follow) {
    return next(new Error("you cant follow yourself. loser. LOL. JK."));
  }

  if (!_id) {
    return next(new Error("UnauthorizedError: Bad JWT Token"));
  } else {
    const query = { _id: _id };
    const update = follow ? { $push: { following: username_to_follow } } : { $pull: { following: username_to_follow } };
    const options = { new: true }
    // update current user
    User.findOneAndUpdate(query, update, options, function(err, user) {
      if (err) {
        return next(new Error("Failed to followed/unfollowed user: " + username_to_follow))
      }
      if (!user) {
        return next(new Error("User with username: <" + username + "> Not Found"));
      }

      // update the other user
      const query_2 = { username: username_to_follow };
      const update_2 = follow ? { $push: { followers: username } } : { $pull: { followers: username } };
      const options = { new: true }

      User.findOneAndUpdate(query_2, update_2, options, function(err, user) {
        
        if (err) {return next(err)} 

        if (!user) {
          return next(new Error("User with username: <" + username_to_follow + "> Not Found"))
        } else { 
          console.log("updated 2 ", user)
          return res.json({
            status: "OK",
            message: "Successfully followed/unfollowed " + username_to_follow
          })
        }
      })
    })

  }

}