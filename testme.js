function something() {
    var x = document.getElementById("id").value; $("input[name=" + x + "]").html();
    $.ajax({type : 'POST',url : 'post.php', data: {id : "ok"}});
    jQuery.extend(true, {}, JSON.parse(x))
}

console.log("Hello")