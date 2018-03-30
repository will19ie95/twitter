var User = require("../models/user.model");
var Item = require("../models/item.model");
const db = require("../db");
const shortId = require("shortid");
const moment = require("moment");
var passport = require("passport");
const nodemailer = require("../nodemailer");


exports.addUser = function (req, res, next) {
  const user = new User();

  user.username = req.body.username;
  user.email = req.body.email;
  user.password = req.body.password;
  user.vToken = shortId.generate()

  user.save(function(err) {
    if (err) { return res.json({
      status: "error",
      msg: "Failed to create user",
      error: err
    })}
    
    // send vToken email verification
    nodemailer.sendMail(user.email, user.vToken);
    return res.json({
      status: "OK",
      message: "Successfully created user",
      user: user,
      vToken: user.vToken,
    })
  })

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
        error: "email not found"
      })
    }

    // check user is not alredy verified 
    if (user.isVerified) {
      // req.flash("error", "Already Verified");
      return res.json({
        status: "error",
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
        error: "error verifiying key"
      })
    }
  })
}
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
      return res.json({
        status: "OK",
        info: info,
        user: req.user,
        token: token
      });
    });
  })(req, res, next);

}
exports.logout = function (req, res, next) {
  if (req.user) {
    req.logout();
    return res.json({
      status: "OK",
      msg: "Logged Out"
    });
  } else {
    return res.json({
      status: "error",
      error: "No user logged in"
    });
  }
}
exports.addItem = function (req, res, next) {

  if(req.user) {
    const username = req.user.username,
      content = req.body.content;

    // create new user 
    const newItem = new Item({
      username: username,
      content: content,
      timestamp: moment().unix()
    })
    newItem.save();
    return res.json({
      status: "OK",
      message: "Successfully created Item",
      id: newItem.id,
      item: newItem,
      timestamp: newItem.timestamp
    })
  } else {
    return res.json({
      status: "error",
      error: "Please LOGIN"
    })
  }

  
}
exports.getItem = function(req, res, next) {
  // check user logged in
  if (req.user) {
    const id = req.params.id;

    Item.findOne({ id: id}, function(err, item) {
      if (err) { return next(err) }
      if (item) {
        var data = {}
        data.item = item
        data.status = "OK"
        return res.json(data)
      }
    })

  } else {
    return res.json({
      status: "error",
      error: "Please LOGIN"
    })
  }

}
exports.search = function(req, res, next) {

  if (req.user) {
    const timestamp = moment.unix(req.body.timestamp),
          limit = req.body.limit

    console.log("TimeStamp: ", req.body.timestamp)

    // db.items.find({ timestamp: { $lte: ISODate("1970-01-18T14:41:26.259Z") } })
    // if (timestamp instanceof Date) {
    Item.find({ timestamp: { $lte: timestamp } }, function (err, items) {
      if (err) { return next(err) }
      res.json({
        status: "OK",
        items: items
      })
    })
    // } else {
    //   res.json({
    //     status: "error",
    //     error: "Invalid timestamp"
    //   })
    // }

    

  } else {
    return res.json({
      status: "error",
      error: "Please LOGIN"
    })
  }


}
exports.getUser = function(req, res, next) {
  
  // const id = req.params.id;
  console.log("Getting User with payload: ", req.payload);
  if (!req.payload._id) {
    res.json({
      status: "error",
      error: "Missing JWT Token",
      msg: "UnauthorizedError: private profile"
    });
  } else {
    User.findById(req.payload._id)
      .exec(function (err, user) {
        if (err) { res.json({
          status: "error",
          error: "Failed to find User"
        })}
        res.json({
          status: "OK",
          msg: "Found User",
          user: user
        });
      });
  }

}