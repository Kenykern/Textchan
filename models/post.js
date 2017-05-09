/* Textchan
 * Licensed under the MIT License
 * (c) 2017 Trigex
 */

var mongoose = require("mongoose");
var autoIncrement = require("mongoose-auto-increment");

var postSchema = new mongoose.Schema({
    name: String,
    trip: String,
    content: String,
    thread: [{type: mongoose.Schema.Types.ObjectId, ref: "Thread"}],
    creation: String,
    ip: String
});

postSchema.plugin(autoIncrement.plugin, {model: "Post", field: "postId"});
module.exports = mongoose.model("Post", postSchema);
