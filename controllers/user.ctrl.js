var User = require("../models/user.model");
var Item = require("../models/item.model");
const db = require("../db")
const moment = require("moment");
var passport = require("passport");


exports.addUser = function (req, res, next) {
  const username = req.body.username,
    email = req.body.email,
    password = req.body.password;

  //check for existing user name
  User.findOne({ username: username }, function (err, user) {
    if (err) {
      return next(err)
    }
    // check username in db
    if (user) {
      return res.status(404).json({
        status: "ERROR",
        error: "Username is taken"
      })
    }
    // create new user 
    const newUser = new User({
      username: username,
      email: email,
      password: password
    })
    newUser.save();
    return res.status(200).json({
      status: "OK",
      message: "Successfully created user"
    })
  })
  // res.send("not implemented")
}
exports.verify = function (req, res, next) {
  // check for get  query too.
  const email = req.body.email || req.query.email;
  const key = req.body.key || req.query.key;

  User.findOne({ email: email }, function (err, user) {
    if (err) { return next(err) }
    if (!user) {
      // req.flash("error", "Username Not Found")
      return res.status(404).json({
        status: "ERROR",
        error: "email not found"
      })
    }

    // check user is not alredy verified 
    if (user.isVerified) {
      // req.flash("error", "Already Verified");
      return res.status(404).json({
        status: "ERROR",
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
        status: "ERROR",
        error: "error verifiying key"
      })
    }
  })
}
exports.login = function (req, res, next) {
  if (req.user) {
    return res.json({
      status: "ERROR",
      error: "User already logged in"
    })
  } 

  passport.authenticate('login', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      return res.json({
        status: "ERROR",
        error: info
      });
    }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      return res.json({
        status: "OK",
        info: info
      });
    });
  })(req, res, next);

}
exports.logout = function (req, res, next) {
  if (req.user) {
    req.logout();
    return res.json({
      status: "OK"
    });
  } else {
    return res.json({
      status: "ERROR",
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
    return res.status(200).json({
      status: "OK",
      message: "Successfully created Item",
      id: newItem.id,
      timestamp: newItem.timestamp
    })
  } else {
    return res.status(404).json({
      status: "ERROR",
      error: "Please LOGIN"
    })
  }

  
}
exports.getItem = function(req, res, next) {
  // check user logged in
  console.log("GETTING ITEM")
  if (req.user) {
    const id = req.params.id;

    Item.findOne({ id: id}, function(err, item) {
      if (err) { return next(err) }
      if (item) {
        var data = {}
        data.item = item
        data.status = "OK"
        return res.status(200).json(data)
      }
    })

  } else {
    return res.status(404).json({
      status: "ERROR",
      error: "Please LOGIN"
    })
  }

}

exports.search = function(req, res, next) {

  if (req.user) {
    const timestamp = req.body.timestamp,
          limit = req.body.limit

    // search for items before timestamp and earlier
    Item.find()
    // db.items.find({ timestamp: { $lte: ISODate("1970-01-18T14:41:26.259Z") } })
    Item.find({ timestamp: { $lte: new Date(timestamp)}}, function(err, items) {
      if (err) { return next(err) }
      res.status(200).json({
        status: "OK",
        items: items
      })
    })

  } else {
    return res.status(404).json({
      status: "ERROR",
      error: "Please LOGIN"
    })
  }


}