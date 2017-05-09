/* Textchan
 * Licensed under the MIT License
 * (c) 2017 Trigex
 */

if($(".thread").length) {
    var clicked = false;
    var threadId = $("input:hidden").val();
    var posts = $(".post").length;

    $("#refresh").click(function(){
        if(!clicked) {
            clicked = true;
        } else {
            clicked = false;
        }
    });

    setInterval(function(){
        if(clicked) {
            $(".thread").load("/api/thread/" + threadId);
            var newPosts = $(".post").length;
            if(newPosts > posts) {
                posts = newPosts;
                Push.create("Textchan", {
                    body: "There were new posts!",
                    timeout: 5000,
                    onClick: function () {
                        window.focus();
                        this.close();
                    }
                });
            }
        }
    }, 5000);

    $("#delete").on("click", function(){
        console.log("delete nigger");
        $.post("/admin/delete/post", {id: $(this).parent().find(".postnumber").text()});
    });

    $("#ban").on("click", function(){
        console.log("ban nigger");
        $.post("/admin/ban/ip", {ip: $(this).parent().find(".ip").text()});
    });

    $("#delete-thread").on("click", function(){
        $.post("/admin/delete/thread", {id: threadId});
    });
}
