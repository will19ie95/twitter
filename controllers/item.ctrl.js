const Item = require("../models/item.model");
const db = require("../db");
const moment = require("moment");

exports.addItem = function (req, res, next) {
  const username = req.body.username;
  const content = req.body.content;

  const newItem = new Item({
    username: username,
    content: content,
    timestamp: moment().unix()
  })
  newItem.save(err => {
    if (err) { return next(err) }
    return res.json({
      status: "OK",
      message: "Successfully created Item",
      id: newItem.id,
      item: newItem,
    })
  });
}
exports.getItem = function (req, res, next) {
  const id = req.query.id || req.params['id'];

  Item.findOne({ id: id }, function (err, item) {
    if (err) { return next(err) }

    if (!item) {
      return next(new Error("Item with ID: <" + id + "> Not Found"))
    }

    return res.json({
      status: "OK",
      message: "Item Found",
      item: item
    })

  })
}
exports.search = function (req, res, next) {

  const timestamp = moment.unix(req.body.timestamp);
  const limit = req.body.limit;

  console.log("TimeStamp: ", req.body.timestamp)

  Item.find({ timestamp: { $lte: timestamp } }, function (err, items) {
    if (err) { return next(err) }

    if (items) {
      res.json({
        status: "OK",
        message: "Found Items",
        items: items
      })
    } else {
      return res.next(new Error("No Items Found"))
    }

  })

}
exports.deleteItem = function (req, res, next) {
  
  const id = req.query.id || req.params[0];

  Item.deleteOne({ id: id }, function(err) {
    // NEEDS STATUS NOT 2XX
    if (err) { res.next(err) }
    
    return res.status(200).json({
      status: "200 OK",
      message: "Successfully DELETED Item with id: " + id
    })
    
  })


} 