/* Textchan
 * Licensed under the MIT License
 * (c) 2017 Trigex
 */

var mongoose = require("mongoose");

var boardSchema = new mongoose.Schema({
    code: String,
    name: String,
    description: String
});

module.exports = mongoose.model("Board", boardSchema);
