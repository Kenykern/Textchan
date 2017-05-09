/* Textchan
 * Licensed under the MIT License
 * (c) 2017 Trigex
 */

var mongoose = require("mongoose");

var ipSchema = new mongoose.Schema({
    ip: String
});

module.exports = mongoose.model("Ip", ipSchema);
