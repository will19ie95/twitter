const Item = require("../models/item.model");
const User = require("../models/user.model");
const db = require("../db");
const moment = require("moment");
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  // host: '192.168.1.44:9200',
  host: '130.245.168.171:9200',
  // log: 'trace'
});
// client.ping({
//   // ping usually has a 3000ms timeout
//   requestTimeout: 1000
// }, function (err) {
//   if (err) { return next(err) } 
//   console.log('Elasticsearch is well...');
// });

exports.addItem = function (req, res, next) {
  const username = req.user.username;
  const content = req.body.content;
  const parent  = req.body.parent;
  const childType = req.body.childType || null;

  const newItem = new Item({
    username: username,
    content: content,
    timestamp: moment().unix(),
    parent: parent,
    childType: childType
  })
  newItem.save(err => {
    if (err) { return next(err) }
    // UPDATE ELASTIC SEARCH
    const id_string = JSON.parse(JSON.stringify(newItem._id))
    return res.json({
      status: "OK",
      message: "Successfully created Item",
      id: newItem.id,
      item: newItem
    })
    
  });
}
exports.getItem = function (req, res, next) {
  const id = req.query.id || req.params['id'];

  Item.findOne({ id: id }, function (err, item) {
    if (err) { return next(err) }
    if (!item) { return next(new Error("Item Not Found")) }
    return res.json({
      status: "OK",
      message: "Item Found",
      item: item
    })
  })
}
exports.search = function (req, res, next) {
  const query_string = req.body.q;

  if (query_string) {
    return next();
  }

  // req.user populated by jwt cookie
  const username = req.user.username // curr user
  const timestamp = moment().unix(req.body.timestamp) || moment().unix(); //default time is NOW if none provided
  const username_filter = req.body.username;
  const rank = req.body.rank === "time" ? "time": "interest"; // order return item by "time" or "interest", default "interest".
  const parent = req.body.parent || ""; // default none
  const hasMedia = (req.body.hasMedia !== false ) ? true : false;; //default true
  const only_following = (req.body.following !== false) ? true : false; // default true 

  var limit = req.body.limit || 25;       // default 25 if none provided
  limit = (limit > 100) ? 100 : limit;      // limit to 100

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
        return res.json({
          status: "OK",
          message: "Found Items",
          items: items.slice(0, limit)
        })
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
      return res.json({
        status: "OK",
        message: "Found Items",
        items: items.slice(0, limit)
      })
    })
  }
}
exports.deleteItem = function (req, res, next) {
  const id = req.query.id || req.params[0];
  // delete associated media files...first or later
  // FIX ME

  // delete item
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
exports.likeItem = function (req, res ,next) {
  const username = req.user.username;
  const user_id = req.user._id;
  const item_id = req.params['id'];
  const like = (req.body.like !== false) ? true : false;
  
  const query = { id : item_id };
  const update = like ? { $addToSet: { liked_by: username } } : { $pull: { liked_by: username } };
  Item.findOneAndUpdate(query, update, (err, updated_item) => {
    if (err) { return next(err) }
    if (!updated_item) { return next(new Error("Failed to like item with query: ", query)) }
    return res.json({
      status: "OK",
      message: "Successfully updated like for item: " + item_id
    })
  })
}
exports.elasticSearch = function (req, res, next) {
  
  // req.user populated by jwt cookie
  const username = req.user.username // curr user
  const timestamp = moment().unix(req.body.timestamp) || moment().unix(); //default time is NOW if none provided
  const query_string = req.body.q;
  const username_filter = req.body.username;
  const rank = req.body.rank === "time" ? "time" : "interest"; // order return item by "time" or "interest", default "interest".
  const parent = req.body.parent || ""; // default none
  const hasMedia = (req.body.hasMedia !== false) ? true : false;; //default true
  const only_following = (req.body.following !== false) ? true : false; // default true 

  var limit = req.body.limit || 25;       // default 25 if none provided
  limit = (limit > 100) ? 100 : limit;      // limit to 100

  // console.log(username + " Searching with ")
  // console.log(req.body)

  // content: /query_string/i,
  var query = {
    "bool" : {
      "must": [],
      "should": []      
    }
  };

  if (query_string) {
    // must match search string.
    query.bool.must.push({
      "match": {
        "content": query_string
      }
    })
  }

  if (username_filter) {
    // must match username string.
    query.bool.must.push({
      "match": {
        "username": username_filter
      }
    })
  }

  if (only_following) {
    // get followings

    User.findOne({ username: username }, function (err, user) {
      if (err) { return next(err) }
      if (!user) {
        return next(new Error("User not Found"))
      }

      // list of following, only return if match any of these
      var following = user.following;

      // append username constraint if exist
      // if (username_filter) {
      //   // possible duplication, fix me
      //   following.push(username_filter)
      // }

      
      // turn into query style { "username": }
      following_list = [];
      for (var i = 0; i < following.length; i++ ){
        following_list.push({
          "match": {
            "username": following[i]
          }
        })
      }
      
      query.bool.should = following_list;

      // query.bool.should.push({
      //   "minimum_should_match": 1
      // });
      
      var search_body = {
        from: 0,
        size: 1000,
        sort: [
          { timestamp: { "order": "desc" } }
        ],
        query: query
      }

      client.search({
        index: 'twitter',
        type: 'items',
        body: search_body
      }).then(function (resp) {
        var hits = resp.hits.hits;
        // console.log("ElasticSearch Hit: ")
        // console.log(hits)

        // hits[x]._source
        function reduceItem(hit) {
          const item = hit._source;
          item._id = hit._id;
          return item;
        }

        // map reduce items from elastic hit result
        const items = hits.map(reduceItem)
        // console.log("Items Found: " + items.length)

        return res.json({
          status: "OK",
          message: "Elastic Search Found Items",
          items: items.slice(0, limit)
          // hits: hits.slice(0, limit)
        })
      }, function (err) {
        if (err) { return next(err) }
      });

    })
  } else {
    var search_body = {
      from: 0,
      size: 1000,
      sort: [
        { timestamp: { "order": "desc" } }
      ],
      query: query
    }

    client.search({
      index: 'twitter',
      type: 'items',
      body: search_body
    }).then(function (resp) {
      var hits = resp.hits.hits;
      // console.log("ElasticSearch Hit: ")
      // console.log(hits)

      // hits[x]._source
      function reduceItem(hit) {
        const item = hit._source;
        item._id = hit._id;
        return item;
      }

      // map reduce items from elastic hit result
      const items = hits.map(reduceItem)

      return res.json({
        status: "OK",
        message: "Elastic Search Found Items",
        items: items.slice(0, limit)
        // hits: hits.slice(0, limit)
      })
    }, function (err) {
      if (err) { return next(err) }
    });
  }

  

}
