var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var moment = require("moment");
var shortId = require("shortid");

const itemSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  property: {
    likes: {
      type: Number,
      default: 0
    }
  },
  retweeted: {
    type: Number,
    default: 0
  },
  content: {
    type: String,
    default: "default content"
  },
  timestamp: {
    type: Date,
    // or Date.now()?
    // default: moment().unix(),
    required: true
  },
  id: {
    type: String,
    unique: true,
    default: shortId.generate
  }
});

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;
