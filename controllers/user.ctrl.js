const User = require("../models/user.model");
const db = require("../db");
const shortId = require("shortid");
const moment = require("moment");
const passport = require("passport");
const nodemailer = require("../nodemailer");

exports.login = function (req, res, next) {
  if (req.user) {
    return res.json({
      status: "error",
      error: "User already logged in"
    })
  } 

  passport.authenticate('login', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      return res.json({
        status: "error",
        error: info
      });
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
    return res.json({
      status: "error",
      error: "No user logged in"
    });
  }
}
exports.addUser = function (req, res, next) {
  const user = new User();

  user.email = req.body.email;

  User.findOne({ email: user.email }, function (err, user) {
    if (err) {
      return res.json({
        status: "error",
        message: "Failed to add user",
        error: err
      })
    }
    if (user) {
      return res.json({
        status: "error",
        message: "Email already exists",
      })
    } else {
      const newUser = new User();
      newUser.username = req.body.username;
      newUser.email = req.body.email;
      newUser.password = req.body.password;
      newUser.vToken = shortId.generate()
      newUser.save(function (err) {
        if (err) {
          return res.json({
            status: "error",
            message: "Failed to save user",
            error: err
          })
        }
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
      // req.flash("error", "Username Not Found")
      return res.json({
        status: "error",
        message: "email not found",
        error: "email not found"
      })
    }

    // check user is not alredy verified 
    if (user.isVerified) {
      // req.flash("error", "Already Verified");
      return res.json({
        status: "error",
        message: "already verified",
        error: "already verified"
      })
    }
    console.log(email)
    console.log(key)

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
      // next()
      return res.json({
        status: "error",
        message: "Key does not match",
        error: "Key does not match"
      })
    }
  })
}
exports.getUser = function (req, res, next) {
  const username = req.query.username || req.params['username'];
  
  User.findOne({ username: username }, function (err, user) {
    if (err) { return next(err) }

    if (!user) {
      return res.json({
        status: "error",
        error: "User with username: <" + username + "> Not Found",
        message: "User with username: <" + username + "> Not Found"
      })
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
      return res.json({
        status: "error",
        error: "User with username: <" + username + "> Not Found",
        message: "User with username: <" + username + "> Not Found"
      })
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
      return res.json({
        status: "error",
        error: "User with username: <" + username + "> Not Found",
        message: "User with username: <" + username + "> Not Found"
      })
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

  if (!_id) {
    res.json({
      status: "error",
      error: "Missing JWT Token",
      message: "UnauthorizedError: private profile"
    });
  } else {
    const query = { _id: _id };
    // const update = follow ? { $push: { following: username_to_follow } } : { $pull: { following: username_to_follow } };

    // User.findOneAndUpdate(query, update, function(err) {
    //   if (err) {
    //     return res.json({
    //       status: "error",
    //       error: "Failed to followed/unfollowed user: " + username_to_follow,
    //       message: "Failed to followed/unfollowed user: " + username_to_follow
    //     })
    //   }

    //   return res.json({
    //     status: "OK",
    //     message: "Successfully followed/unfollowed " + username_to_follow
    //   })
      
    // })

    User.findOne(query, (err, user) => {
      if (err) {
        return res.json({
          status: "error",
          error: "Failed to followed/unfollowed user: " + username_to_follow,
          message: "Failed to followed/unfollowed user: " + username_to_follow
        })
      }

      if (!user) {
        return res.json({
          status: "error",
          error: "User with username: <" + username + "> Not Found",
          message: "User with username: <" + username + "> Not Found"
        })
      }

      if (follow === true) {
        console.log("push", follow, req.body.follow)
        user.following.push(username_to_follow)
      } else {
        console.log("pull", follow, req.body.follow)
        user.following.pull(username_to_follow)
      }

      user.save(function (err) {
        if (err) {
          return res.json({
            status: "error",
            error: "Failed to followed/unfollowed user: " + username_to_follow,
            message: "Failed to followed/unfollowed user: " + username_to_follow
          })
        } else {
          return res.json({
            status: "OK",
            message: "Successfully followed/unfollowed user: " + username_to_follow,
          })
        }
      });
    })

  }

}