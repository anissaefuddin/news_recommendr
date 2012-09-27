$(function(){

Handlebars.registerHelper('link', function(text, url) {
  return new Handlebars.SafeString(
    "<a href='" + url + "'>" + text + "</a>"
  );
});

var source   = $("#entry-template").html();
var template = Handlebars.compile(source);

$.ajax({
    url: '/recommend_data',
    type: 'GET',
    dataType: 'json',
    complete: function(request) {

      json = request.responseText;
      data = JSON.parse(json);

      var html = '';
    for (var i = 0; i < data.length; i++) {
      data[i].content = data[i].content.substring(0, 400)
      html += template(data[i]);
    };
    console.log(html)
    $('#container').html(html);

      $('#container').masonry({
        // options
        itemSelector : '.item',
        containerWidth: '240px'
   
      });
    }
  });

});