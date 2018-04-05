const Item = require("../models/item.model");
const User = require("../models/user.model");
const db = require("../db");
const moment = require("moment");

exports.addItem = function (req, res, next) {
  const username = req.user.username;
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
      return next(new Error("Item Not Found"))
    }

    return res.json({
      status: "OK",
      message: "Item Found",
      item: item
    })

  })
}
exports.search = function (req, res, next) {

  // const username = req.payload.username
  const username = req.user.username

  const timestamp = moment().unix(req.body.timestamp) || moment().unix();
  const query_string  = req.body.q
  const username_filter = req.body.username
  var only_following = req.body.following //default true
  var limit = req.body.limit || 25; //default 25, max 100

  if (limit > 100) {
    limit = 100 // max 100
  }

  if (only_following !== false) {
    only_following = true; //default true
  }
  
  // content: /query_string/i,
  var query = { 
    timestamp: { $lte: timestamp }
  }

  // append query regex for content if exist
  if (query_string) {
    query["content"] = {
      "$regex": query_string,
      "$options": "i" // ignore cases
    }    
  }
  

  // if true, return post by jwt user following
  if (only_following) {
    // find following for jwt user
    User.findOne({ username: req.user.username }, function (err, user) {
      // list of following, only return if match any of these
      var following = user.following;

      // append username constraint if exist
      if (username_filter) {
        // possible duplication, fix me
        following.push(username_filter)
      }

      var following_filter = { $in: following }

      query["username"] = following_filter

      Item.find(query, function (err, items) {
        if (err) { return next(err) }
        if (!items) { return next(new Error("No Items found")) }
        if (items) {
          res.json({
            status: "OK",
            message: "Found Items",
            items: items.slice(0, limit)
          })
        } else {
          return res.next(new Error("No Items Found"))
        }
      })
    })
  } else {
    // append username constraint if exist
    if (username_filter) {
      // Create username key in query object
      query["username"] = {
        // append username_filter to search for it
        $in: [
          username_filter
        ]
      }
    }
    
    // only following is false, return all
    Item.find(query, function (err, items) {
      if (err) { return next(err) }
      if (!items) { return next(new Error("No Items found")) }
      if (items) {
        res.json({
          status: "OK",
          message: "Found Items",
          items: items.slice(0, limit)
        })
      } else {
        return res.next(new Error("No Items Found"))
      }
    })
  }


  

}
exports.deleteItem = function (req, res, next) {
  
  const id = req.query.id || req.params[0];
  
  Item.deleteOne({ id: id }, function(err) {
    // NEEDS STATUS NOT 2XX
    if (err) { 
      return res.status(500).json({
        status: "error",
        error: err.message
      })
    }
    
    return res.status(200).json({
      status: "200 OK",
      message: "Successfully DELETED Item with id: " + id
    })
    
  })


} 