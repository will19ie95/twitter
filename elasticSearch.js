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

  // content: /query_string/i,
  var query = {
    timestamp: { $lte: timestamp }
  }

  client.search({
    index: 'twitter',
    type: 'items',
    body: {
      query: {
        match: {
          content: query_string
        }
      }
    }
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