var express = require('express');
var router = express.Router();
var UserCtrl = require("../controllers/user.ctrl")
var ItemCtrl = require("../controllers/item.ctrl")
var secret = require("../secret");
var jwt = require('express-jwt');
var auth = jwt({
  secret: secret.mySecret,
  userProperty: 'payload'
});

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// using JWT, server stateless no login
router.post("/login", UserCtrl.login)

// USER
router.get("/user/:username/followers", auth, UserCtrl.getFollowers)
router.get("/user/:username/following", auth, UserCtrl.getFollowing)
router.get("/user/:username", auth, UserCtrl.getUser)
router.post("/follow", auth, UserCtrl.follow)
router.post("/adduser", UserCtrl.addUser)
router.post("/verify", UserCtrl.verify)

// ITEM
router.get("/item/:id", auth, ItemCtrl.getItem) // /item/:id
router.get("/item", auth, ItemCtrl.getItem) // /item?id=    Support or nah?
router.post("/additem", auth, ItemCtrl.addItem)
router.post("/search", auth, ItemCtrl.search)


module.exports = router;
