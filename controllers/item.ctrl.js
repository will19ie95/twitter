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
    if (err) {
      return res.json({
        status: "error",
        error: "failed to save item",
        message: "failed to save item"
      })
    }
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
      return res.json({
        status: "error",
        message: "Item with ID: <" + id + "> Not Found",
        error: "Item with ID: <" + id + "> Not Found",
      })
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
      res.json({
        status: "error",
        error: "No Items Found",
        message: "No Items Found",
      })
    }

  })

}
exports.deleteItem = function (req, res, next) {
  
  const id = req.query.id || req.params[0];

  Item.deleteOne({ id: id }, function(err) {
    if (err) {
      return res.status(500).json({
        status: "error",
        error: "failed to DELETE item with id: " + id,
        message: "failed to DELETE item with id: " + id
      })
    }
    
    return res.status(200).json({
      status: "200 OK",
      message: "Successfully DELETED Item with id: " + id
    })
    
  })


} 