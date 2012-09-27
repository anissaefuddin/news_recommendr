url_regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/

tech_urls = ['http://feeds.feedburner.com/blogspot/MKuf?format=xml', 'http://jcla1.com/rss.xml'];
human_urls = ['http://geographyblog.eu/wp/feed/'];
science_urls = ['http://blogs.nature.com/feed/'];

sources = [tech_urls, human_urls, science_urls];

subscribed_urls = [];

$(function() {
	$('#addbuttonrss').click(function(e){
		var input = $('#rssinput').val()
		if (url_regex.test(input) & subscribed_urls.indexOf(input) === -1) {
			subscribed_urls.push(input);
			$('#rssurls').append('<p>' + input + '</p>')
		} else {
			alert('wrong input or already submitted!');
		}
	});

	$('#submitrss').click(function(e){
		$('input[type="checkbox"]').each(function(key, value){
			if ($(value).is(':checked')) {
				for(var i = 0; i < sources[key].length; i++){
					if (subscribed_urls.indexOf(sources[key][i]) === -1) {
						subscribed_urls.push(sources[key][i]);
					}
				}
			}
		});
		
		// AJAX Stuff

		$.ajax({
			url: '/recrss',
			type: 'POST',
			data: {feeds: subscribed_urls},
			completed: function(request){
				window.location = "/"
			}
		})



	});
});