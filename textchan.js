#!/usr/bin/env nodejs
/* Textchan
 * Licensed under the MIT License
 * (c) 2017 Trigex
 */

var express     = require("express"),
    app         = express(),
    fs          = require("fs"),
    mongoose    = require("mongoose"),
    autoIncrement = require("mongoose-auto-increment"),
    bodyParser = require("body-parser"),
    tripcode    = require("tripcode"),
    timestamp   = require("time-stamp"),
    favicon     = require('serve-favicon');

// database connection
var con = mongoose.connect("mongodb://localhost/textchan");
autoIncrement.initialize(con);

// models
var board = require("./models/boards.js");
var thread = require("./models/thread.js");
var post = require("./models/post.js");

// go to public directory for assets
app.use(express.static("public"));

// set view engine to use ejs
app.set("view engine", "ejs");

// serve favicon
app.use(favicon(__dirname + '/public/img/favicon.ico'));

// parse posts
app.use(bodyParser.urlencoded({extended: true}));

// config, set to config.json
var config = require("./config.json");

// useful functions
function parseContent(string) {
    var parsed = string.replace(/<(?!br\s*\/?)[^>]+>/g, '').replace(/\[b\](.*?)\[\/b\]/g, "<b>$1</b>").replace(/\[i\](.*?)\[\/i\]/g, "<i>$1</i>").replace(/\[u\](.*?)\[\/u\]/g, "<u>$1</u>").replace(/\[url\=(.*?)\](.*?)\[\/url\]/g, "<a href='$1' rel='nofollow' title='$2 - $1'>$2</a>").replace(/\[url\](.*?)\[\/url\]/g, "<a href='$1' rel='nofollow' title='$1'>$1</a>").replace(/^.*(youtu.be|youtube.com\/embed\/|watch\?v=|\&v=)([^!<>@&#\/\s]*)/g, "<iframe style='width:425px;height:350px;' src='https://www.youtube.com/embed/$2' frameborder='0' allowfullscreen></iframe>").replace(/>>(.*[0-9])/g, "<a href='#$1'>>>$1</a>").replace(/^>(.*?)$/g, "<span class='quote'>>$1</span>").replace(/(?:\r\n|\r|\n)/g, "<br />");
    return parsed;
}

// index page
app.get("/", function(req, res){
    // grab all boards
    board.find({}, function(err, board){
        // render index
        res.render("index", {config: config, boards: board});
    });
});


app.get("/error", function(req, res){
    res.render("error", {config: config});
});

// board page
app.get("/:board", function(req, res){
    var code = req.params.board;
    board.find({code: code}, function(err, board){
        if(err) {
            console.log(err);
        } else if(board.length != 0) {
            var name = board[0]["name"];
            var description = board[0]["description"];
            thread.find({board: code}, function(err, thread){
                res.render("board", {config: config, code: code, name: name, description: description, threads: thread});
            });
        } else {
            res.render("404", {config: config});
        }
    });
});

app.get("/thread/:id", function(req, res){
    var id = req.params.id;

    // grab thread
    thread.find({_id: id}, function(err, thread){
        if(err) {
            console.log(err);
        } else if(thread.length != 0) {
            post.find({thread: id}, function(err, posts){
                board.find({code: thread[0]["board"]}, function(err, board){
                    var name = board[0]["name"];
                    var code = board[0]["code"];
                    res.render("thread", {config: config, posts: posts, thread: thread, tripcode: tripcode, threadId: id, name: name, code: code, parseContent: parseContent});
                });
            });
        } else {
            res.render("404", {config: config});
        }
    });

});

app.post("/thread/create", function(req, res){
    var name = req.body.name;
    var trip = req.body.trip;
    var content = req.body.content;
    var code = req.body.code;
    var threadName = req.body.threadName;

    var creation = timestamp("YYYY/MM/DD HH:mm");

    // Check for any mistakes in post
    if(!threadName || !content) {
        res.redirect("/error");
    } else {
        // create new thread
        var newThread = new thread({name: threadName, board: code, creation: creation});

        newThread.save(function(err){
            if(err) console.log(err);

            // make post
            post.create({
                name: name,
                trip: trip,
                content: content,
                creation: creation,
                thread: newThread._id
            }, function(err, post){
                if(err) {
                    console.log(err);
                }
                else {
                    res.redirect("/thread/" + newThread._id);
                }
            });
        });
    }
});

app.post("/post/create", function(req, res){
    var name = req.body.name;
    var trip = req.body.trip;
    var content = req.body.content;
    var threadId = req.body.threadId;

    var creation = timestamp("YYYY/MM/DD HH:mm");

    if(!content || !threadId) {
        res.redirect("/error");
    } else {
        thread.find({_id: threadId}, function(err, thread){
            post.create({
                name: name,
                trip: trip,
                content: content,
                thread: threadId,
                creation: creation
            }, function(err, post){
                if(err) {
                    console.log(err);
                } else {
                    res.redirect("/thread/" + threadId);
                }
            });
        });
    }
});

// listen for requests
app.listen(8070, "127.0.0.1", function(){
    console.log("Started server listening at 127.0.0.1 on port 8070");
});
