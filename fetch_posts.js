var FeedParser = require('feedparser');
var redis = require('redis');

var client = redis.createClient();

client.on("error", function (err) {
        console.log("Error " + err);
});


function get_stories_for_user(username){
	client.get('user:' + username, function(err, reply){
		if (err) throw err;

		var user = JSON.parse(reply)
		var parser = new FeedParser();

		for (var i = 0; i < user.feeds.length; i++) {
			[i]
		};
		parser.parseUrl();

		parser.on('article', function(article){});
	});
});
}

function save_storie_to_db(storie){}
