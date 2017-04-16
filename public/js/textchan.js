var clicked = false;

$("#refresh").click(function(){
    if(!clicked) {
        clicked = true;
    } else {
        clicked = false;
    }
});
