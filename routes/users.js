const express = require('express');
const router = express.Router();
const UserCtrl = require("../controllers/user.ctrl")
const ItemCtrl = require("../controllers/item.ctrl")
const MediaCtrl = require("../controllers/media.ctrl")
const multer = require('multer')
const upload = multer();
const secret = require("../secret");
const jwt = require('express-jwt');
const auth = jwt({
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
// router.post("/search", auth, ItemCtrl.search, ItemCtrl.elasticSearch)
router.post("/search", auth, ItemCtrl.elasticSearch)
// router.post("/elasticsearch", auth, ItemCtrl.elasticSearch)
router.post("/additem", auth, ItemCtrl.addItem)
router.get("/item/:id", ItemCtrl.getItem) // /item/:ida
router.get("/item", ItemCtrl.getItem) // /item?id=    Support or nah?

// AMQP Client Request.
// app.post("/item/:id/like", auth, Amqp.likeItem) // /item/:id
// app.post("/search", auth, Amqp.search)
// app.post("/additem", auth, Amqp.addItem)

// media
router.post("/addmedia", function(req, res, next) { if(req.body.content) { next() } }, upload.single("contents"), MediaCtrl.addMedia);
router.get("/media/:fileId", MediaCtrl.getMedia)

module.exports = router;
