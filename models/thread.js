/* Textchan
 * Licensed under the MIT License
 * (c) 2017 Trigex
 */

var mongoose = require("mongoose");

var threadSchema = new mongoose.Schema({
    name: String,
    board: String,
    creation: String
});

module.exports = mongoose.model("Thread", threadSchema);
