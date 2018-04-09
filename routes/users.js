var express = require('express');
var router = express.Router();
var UserCtrl = require("../controllers/user.ctrl")
var ItemCtrl = require("../controllers/item.ctrl")
var secret = require("../secret");
var jwt = require('express-jwt');
var auth = jwt({
  secret: secret.mySecret,
  getToken: function (req) { return req.cookies['twitter-jwt']; }
});

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// using JWT, server stateless no login
router.post("/login", UserCtrl.login)
router.post("/logout", UserCtrl.login)

// USER
router.get("/user/:username/followers", UserCtrl.getFollowers)
router.get("/user/:username/following", UserCtrl.getFollowing)
router.get("/user/:username", UserCtrl.getUser)
router.post("/follow", auth, UserCtrl.follow)
router.post("/adduser", UserCtrl.addUser)
router.post("/verify", UserCtrl.verify)

// ITEM
router.post("/item/:id/like", auth, ItemCtrl.likeItem) // /item/:id
router.get("/item/:id", ItemCtrl.getItem) // /item/:id
router.get("/item", ItemCtrl.getItem) // /item?id=    Support or nah?
router.post("/search", auth, ItemCtrl.search)
router.post("/additem", auth, ItemCtrl.addItem)


module.exports = router;
