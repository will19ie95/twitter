var express = require('express');
var router = express.Router();
var UserCtrl = require("../controllers/user.ctrl")
var secret = require("../secret");
var jwt = require('express-jwt');
var auth = jwt({
  secret: secret.mySecret,
  userProperty: 'payload'
});

/* GET users listing. */
router.get('/', auth, UserCtrl.getUser);

router.post('/adduser', UserCtrl.addUser)
router.post("/verify", UserCtrl.verify)
router.post("/login", UserCtrl.login)
// router.post("/logout", auth, UserCtrl.logout)
router.post("/additem", auth, UserCtrl.addItem)
router.post("/search", auth, UserCtrl.search)
router.get("/item/:id", auth, UserCtrl.getItem)
router.get("/user", auth, UserCtrl.getUser)

module.exports = router;
