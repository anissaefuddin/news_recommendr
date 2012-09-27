$.ajax({
    url: '/getposts',
    type: 'GET',
    dataType: 'json',
    complete: function(request) {
      var posts = JSON.parse(request.responseText);
      var html = '';
      
      for (var i = 0; i < posts.length; i++){

        content = posts[i].content.replace(/(<([^>]+)>)/ig, '')

        html += "<div class='item'>"
        + "<img height='48' src='http://placehold.it/48x48' width='48'>"
        + "<h2>" + posts[i].title + "</h2>"
        + "<p>" + content.substring(0, 400) + "</p>"
        + "<p class='rating'>"
        + "<button class='like'>Like</button>"
        //+ Math.floor(Math.random() * 100) + "%"
        + "<button class='dislike'>Dislike</button>"
        + "<div class='hidden'>" + posts[i].url + "</div>"
        + "</p></div>"
      }

      $('#container').append(html);




      $('.item').each(function(key, value){
        var like = $(value).find('.like')
        var dislike = $(value).find('.dislike')
        var url = $(value).find('div.hidden').text()

        like.click(function(){
          send_like(url);
          //like.parent().parent().fadeOut(500, like.parent().parent().remove);
          dislike.parent().parent().remove()
        });
        dislike.click(function(){
          send_dislike(url)
          //dislike.parent().parent().fadeOut(500, dislike.parent().parent().remove);
          dislike.parent().parent().remove()
          
        });



      })



    }
  });

$('#container').masonry({
  // options
  itemSelector : '.item',
});


function send_like(url) {
  $.ajax({
    url: '/reclike',
    data: { 0: url },
    type: 'POST'
  });

}

function send_dislike(url) {
  $.ajax({
    url: '/recdislike',
    data: { 0: url },
    type: 'POST'
  });
}