$retbtn = $('#retrievebutton');
$classifybtn = $('#classifybutton');

$retbtn.click(function(e) {
	get_all_posts();
});

$classifybtn.click(function(e) {
	classify_posts();
});

function get_all_posts() {
	$.ajax({
		url: '/getallposts',
		completed: function(request) {
			console.log('Retrieved all posts');
		}
	});
}

function classify_posts() {
	$.ajax({
		url: '/classify_posts',
		completed: function(request) {
			console.log('Classified all posts');
		}
	});
}