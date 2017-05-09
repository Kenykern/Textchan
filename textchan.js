/* Textchan
 * Licensed under the MIT License
 * (c) 2017 Trigex
 */

var express     = require("express"),
    app         = express(),
    session     = require("express-session"),
    fs          = require("fs"),
    mongoose    = require("mongoose"),
    request     = require("request"),
    promise     = require("bluebird");
    autoIncrement = require("mongoose-auto-increment"),
    bodyParser = require("body-parser"),
    tripcode    = require("tripcode"),
    timestamp   = require("time-stamp"),
    favicon     = require('serve-favicon');

// database connection
var con = mongoose.connect("mongodb://localhost/textchan");
autoIncrement.initialize(con);

var config = require("./config.json");

// init session
app.use(session({
    secret: config.secret,
    duration: 30 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true
}));

// models
var board = require("./models/boards.js");
var thread = require("./models/thread.js");
var post = require("./models/post.js");
var ip = require("./models/ip.js");

// go to public directory for assets
app.use(express.static("public"));

// set view engine to use ejs
app.set("view engine", "ejs");

// serve favicon
app.use(favicon(__dirname + '/public/img/favicon.ico'));

// get body of post request
app.use(bodyParser.urlencoded({extended: true}));

// useful functions
function parseContent(string) {
    var parsed = string.replace(/<(?!br\s*\/?)[^>]+>/g, '').replace(/\[b\](.*?)\[\/b\]/g, "<b>$1</b>").replace(/\[i\](.*?)\[\/i\]/g, "<i>$1</i>").replace(/\[u\](.*?)\[\/u\]/g, "<u>$1</u>").replace(/\[url\=(.*?)\](.*?)\[\/url\]/g, "<a href='$1' rel='nofollow' title='$2 - $1'>$2</a>").replace(/\[url\](.*?)\[\/url\]/g, "<a href='$1' rel='nofollow' title='$1'>$1</a>").replace(/^.*(youtu.be|youtube.com\/embed\/|watch\?v=|\&v=)([^!<>@&#\/\s]*)/g, "<iframe style='width:425px;height:350px;' src='https://www.youtube.com/embed/$2' frameborder='0' allowfullscreen></iframe>").replace(/>>\s*([0-9]+)/g, "<a href='#$1'>>>$1</a>").replace(/^>(.*?)$/g, "<span class='quote'>>$1</span>").replace(/(?:\r\n|\r|\n)/g, "<br />");
    return parsed;
}

function checkBanned(userIp) {
    return new Promise(fn);

    function fn(resolve, reject) {
        ip.find({ip: userIp}, function(err, finalIp){
            if(err) reject(err);

            if(finalIp.length) {
                return resolve(true);
            } else {
                return resolve(false);
            }
        });
    }
}

function postWebhook(content) {
    return new promise(fn);

    function fn(resolve, reject) {
        request({
            method: 'POST',
            url: config.webhookUrl,
            json: {
                "content": content,
                "username": config.webhooksUser.username,
                "avatar_url": config.webhooksUser.avatarUrl,
                "channel_id": config.webhookChannel
            }
        }, function(err, res, body){
            if(err) reject(err);

            return resolve(res);
        });
    }
}

// index page
app.get("/", function(req, res){
    // grab all boards
    board.find({}, function(err, board){
        // render index
        res.render("index", {config: config, boards: board});
    });
});

// error!
app.get("/error", function(req, res){
    res.render("error", {config: config});
});

// error!
app.get("/ban", function(req, res){
    res.render("ban", {config: config});
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
                    if(req.session.admin) {
                        res.render("thread", {config: config, posts: posts, thread: thread, tripcode: tripcode, threadId: id, name: name, code: code, parseContent: parseContent, admin: true});
                    } else {
                        res.render("thread", {config: config, posts: posts, thread: thread, tripcode: tripcode, threadId: id, name: name, code: code, parseContent: parseContent});
                    }
                });
            });
        } else {
            res.render("404", {config: config});
        }
    });
});

/* API */
app.get("/api/thread/:id", function(req, res){
    var id = req.params.id;

    // grab thread
    thread.find({_id: id}, function(err, thread){
        if(err) {
            console.log(err);
        } else if(thread.length != 0) {
            post.find({thread: id}, function(err, posts){
                var threadPosts = "";
                posts.forEach(function(post){
                    threadPosts += "<div id='" + post.postId + "' class='post'>";
                    threadPosts += "<div class='postHeader'>";
                    if(post.name) {
                        threadPosts += "<div class='name'>" + post.name + "</div>";
                    } else {
                        threadPosts += "<div class='name'>" + config.postName + "</div>";
                    }
                    threadPosts += "<div class='date'>" + post.creation + "</div>";
                    threadPosts += "<div class='postnumber'>" + post.postId + "</div>";
                    if(post.trip) {
                        threadPosts += "<div class='trip'>!" + tripcode(post.trip) + "</div>";
                    }
                    if(req.session.admin) {
                        threadPosts += "<div id='delete'>Delete Post</div><div id'ban'>Ban User</div>";
                    }
                    threadPosts += "</div>";
                    threadPosts += "<br />";
                    threadPosts += "<div class='content'>" + parseContent(post.content) + "</div>";
                    threadPosts += "</div>";
                });
                res.send(threadPosts);
            });
        } else {
            console.log("Error: Thread ID not found");
        }
    });
});

app.post("/thread/create", function(req, res){
    checkBanned(req.connection.remoteAddress).then(finalIp => {
        if(finalIp) {
            res.redirect("/ban");
        } else {
            var name = req.body.name;
            var trip = req.body.trip;
            var content = req.body.content;
            var code = req.body.code;
            var threadName = req.body.threadName;
            var ip = req.connection.remoteAddress;

            // Check for any mistakes in post
            if(!threadName || !content) {
                res.redirect("/error");
            } else {

                var creation = timestamp("YYYY/MM/DD HH:mm");

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
                        thread: newThread._id,
                        ip: ip,
                        banned: false
                    }, function(err, post){
                        if(err) {
                            console.log(err);
                        }
                        else {
                            if(config.webhookEnabled) {
                                postWebhook("There was a new thread at " + config.siteUrl + "/thread/" + newThread._id + " titled \"" + threadName + "\".").then(res => {
                                }).catch(err => {
                                    console.log(err);
                                });
                            }

                            res.redirect("/thread/" + newThread._id);
                        }
                    });
                });
            }
        }
    }).catch(err => {
        if(err)
            console.log(err);
    });
});

app.post("/post/create", function(req, res){
    checkBanned(req.connection.remoteAddress).then(finalIp => {
        console.log(finalIp);
        if(finalIp) {
            res.redirect("/ban");
        } else {
            var name = req.body.name;
            var trip = req.body.trip;
            var content = req.body.content;
            var threadId = req.body.threadId;
            var code = req.body.code;
            var ip = req.connection.remoteAddress;

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
                        creation: creation,
                        ip: ip,
                        banned: false
                    }, function(err, post){
                        if(err) {
                            console.log(err);
                        } else {
                            if(config.webhookEnabled) {
                                postWebhook("There was a new post at " + config.siteUrl + "/thread/" + threadId + " in the thread \"" + thread[0]["name"] + "\".").then(res => {
                                }).catch(err => {
                                    console.log(err);
                                });
                            }

                            res.redirect("/thread/" + threadId);
                        }
                    });
                });
            }
        }
    }).catch(err => {
        if(err)
            console.log(err);
    });
});

/* ADMIN SHIT */
app.get("/admin/login", function(req, res){
    res.render("adminLogin", {config: config});
});

app.get("/admin/panel", function(req, res){
    if(req.session.admin === "true") {
        res.render("adminPanel", {config: config});
    } else {
        res.render("404", {config: config});
    }
});

app.post("/admin/login", function(req, res){
    var password = req.body.password;

    if(password === config.staffPassword) {
        // User has admin, login
        req.session.admin = "true";
        res.redirect("/admin/panel");
    } else {
        res.redirect("/");
    }
});

app.get("/admin/logout", function(req, res){
    req.session.destroy(function(err){
        if(err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

app.post("/admin/create/board", function(req, res){
    if(req.session.admin === "true") {
        var name = req.body.name;
        var code = req.body.code;
        var description = req.body.description;

        board.create({
            name: name,
            code: code,
            description: description
        }, function(err, board){
            if(err) {
                console.log(err);
            }

            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }
});

app.post("/admin/delete/board", function(req, res){
    if(req.session.admin === "true") {
        var code = req.body.code;

        board.find({code: code}).remove().exec().then(function(err){
            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }
});

app.post("/admin/delete/thread", function(req, res){
    if(req.session.admin === "true") {
        var id = req.body.id;

        thread.find({_id: id}).remove().exec().then(function(err){
            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }
});

app.post("/admin/ban/ip", function(req, res){
    if(req.session.admin === "true") {
        var userIp = req.body.ip;
        ip.create({ip: userIp}, function(err, ip){
            if(err) {
                console.log(err);
            }

            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }
});

app.post("/admin/unban/ip", function(req, res){
    if(req.session.admin === "true") {
        var userIp = req.body.ip;
        ip.find({ip: userIp}).remove().exec().then(function(){
            res.redirect("/");
        }).catch(err => {
            if(err)
                console.log(err);
        });
    } else {
        res.redirect("/");
    }
});

app.post("/admin/ban/ip/post", function(req, res){
    if(req.session.admin === "true") {
        var userIp = req.body.ip;
        var postId = req.body.postId;
        ip.create({ip: userIp}, function(err, ip){
            if(err) {
                console.log(err);
            }

            post.update({postId: postId}, {banned: true}, function(err, post){
                if(err)
                    console.log(err);

                res.redirect("/");
            });
        });
    } else {
        res.redirect("/");
    }
});

app.post("/admin/delete/post", function(req, res){
    if(req.session.admin === "true") {
        var id = req.body.id;

        post.find({postId: id}).remove().exec().then(function(err){
            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }
});

// listen for requests
app.listen(8070, "127.0.0.1", function(){
    console.log("Started server listening at 127.0.0.1 on port 8070");
});
