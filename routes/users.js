var express = require('express');
var router = express.Router();
var UserCtrl = require("../controllers/user.ctrl")

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/adduser', UserCtrl.addUser)
router.post("/verify", UserCtrl.verify)
router.post("/login", UserCtrl.login)
router.post("/logout", UserCtrl.logout)
router.post("/additem", UserCtrl.addItem)
router.post("/search", UserCtrl.search)

router.get("/getitem/:id", UserCtrl.getItem)

module.exports = router;
