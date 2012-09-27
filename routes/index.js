var FeedParser = require('feedparser');
var hash = require('../pass').hash;
var redis = require('redis');
var process_posts = require('../process_posts');

var client = redis.createClient();
var parser = new FeedParser();

client.on("error", function (err) {
        console.log("Error " + err);
});


function Article(title, content, url, source){
  this.title = title;
  this.content = content;
  this.url = url;
  this.id = generate_id();
  this.source =  source;
  this.rated = false;
  this.category = null;

}

var url_regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/


function save_post(post) {
  client.setnx('post:' + post.url, JSON.stringify(post));
}


function put_posts_into_db(err, meta, articles) {
  for (var i = 0; i < articles.length; i++) {
    post = articles[i];
    if (post.description !== null && post.link !== null){
      var article = new Article(post.title, post.description.replace(/(<([^>]+)>)/ig, ''), post.link, post.xmlurl);
    }
    save_post(article);
  };
}



var source_regex = /source\:(.*)/;

function getallposts(callback) {
  client.keys('source:*', function(err, replies){
    for (var i = 0; i < replies.length; i++) {
      var url = replies[i].match(source_regex)[1];
      console.log(url)
      parser.parseUrl(url, put_posts_into_db);
    };
    callback();
  })
}


function save_user(user){
  client.set('user:' + user.username, JSON.stringify(user));
}


function save_source(url, user){
  client.get('source:' + url, function(err, response){
    if (response === null) {
      client.set('source:' + url, url);
    }
  });

  if (user.feeds.indexOf(url) === -1){
    user.feeds.push(url);
    save_user(user);
  }
}

function generate_id(){
  return Math.random().toString(36).substring(10);
}

function register_user(username, pass, fn){
  hash(pass, function(err, salt, hash){
    if (err) throw err;
    var user = {
      username: username,
      salt: salt,
      hash: hash,
      feeds: []
    };
    client.set('user:' + username, JSON.stringify(user));
    fn();
    client.set('model:' + username, JSON.stringify({
      words: {
        like: {},
        dislike: {}
      },
      numberOfPostsLiked: 0,
      numberOfPostsDisliked: 0,
      totalNumberOfPosts: 0
    })); 
  });
}

function authenticate(name, pass, fn) {
  client.get('user:' + name, function(err, reply){
    if (err) throw err;
    
    var user = JSON.parse(reply);
    hash(pass, user.salt, function(err, hash){
      if (err) return fn(err);
      if (hash == user.hash) return fn(null, user);
      fn(new Error('invalid password'));
    });

  });
}

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
}

exports.setup = function(req, res){
  res.render('setup', {title: "Setup your account"});
}

exports.login = function(req, res){
  res.render('login', { title: 'Login'});
};

exports.restr = function(req, res){
  res.render('restricted', {title: 'Restricted'});
}

exports.register = function(req, res){
  res.render('register', {title: 'Register'});
}

exports.recrss = function(req, res){
  client.get('user:' + req.session.user.username, function(err, reply){
    var user = JSON.parse(reply);
    for (var i = 0; i < req.body.feeds.length; i++) {
      save_source(req.body.feeds[i], user)
    };
  });
}

exports.registerpost = function(req, res){
  register_user(req.body.username, req.body.pass, function(){
    authenticate(req.body.username, req.body.pass, function(err, user){

      if (user) {

        req.session.regenerate(function(){
          req.session.user = user;
          res.redirect('/');   
        });

      }

    });
  });
}

exports.auth = function(req, res){
  authenticate(req.body.username, req.body.pass, function(err, user){
    if (err) {
      res.send("invalid password");
    }

    if (user) {

      req.session.regenerate(function(){
        req.session.user = user;
        res.redirect('/');
        
      });
    }
  });
}

exports.rate = function(req, res){
  res.render('rate', {title: "Rate"});
}

exports.getallposts = function(req, res){
  getallposts(function(){
    res.send('done');
  });
}

exports.getposts = function(req, res) {
  var posts = [];
  client.keys('post:*', function(err, replies){
    client.mget(replies, function(err, raw){
      if (raw != undefined){
        var data = [];
        for (var i = 0; i < raw.length; i++) {
          var post = JSON.parse(raw[i])
          if (post.rated != true) {
            data.push(post);
          }
          
        };
        res.send(data);
      }
    });
  });
}

exports.like = function(req, res){
  client.get('post:' + req.body[0], function(err, raw){
    var post = JSON.parse(raw);
    post.rated = true;
    client.set('post:' + req.body[0], JSON.stringify(post))
    process_posts.train_model_of_user(req.session.user, post, 'like')
  });
}

exports.dislike = function(req, res){
  client.get('post:' + req.body[0], function(err, raw){
    var post = JSON.parse(raw);
    post.rated = true;
    client.set('post:' + req.body[0], JSON.stringify(post))
    process_posts.train_model_of_user(req.session.user, post, 'dislike')
  });
}

exports.recommend_data = function(req, res){
  client.keys('post:*', function(err, replies){
    client.mget(replies, function(err, raw){
      if (raw != undefined){
        var data = [];
        for (var i = 0; i < raw.length; i++) {
          var post = JSON.parse(raw[i])
          if (post.rated != true /*&& post.category === 'like'*/) {
            data.push(post);
          }
          
        };
        res.send(data);
      }
    });
  });
}

exports.get_words = function(req, res){
  client.get('model:jcla1', function(err, raw){
    data = JSON.parse(raw);
    list = '';
    for (keya in data.words){
      for (keyb in data.words[keya]){
        list += keyb.replace(/(<([^>]+)>)/ig, '') + ' ';
      }
    }
    res.send(JSON.stringify(list));
  });

}

exports.wordcloud = function(req, res){
  res.render('wordcloud', {title: 'Wordcloud'})
}


exports.recommend = function(req, res){
  res.render('recommend', {title: 'Recommend'});
}

exports.classify_posts = function(req, res){
  client.keys('post:*', function(err, replies){
    client.mget(replies, function(err, raw){
      if (raw != undefined){
        for (var i = 0; i < raw.length; i++) {
          var post = JSON.parse(raw[i])
          if (post.category === null){
            process_posts.classify(post, req.session.user.username, function(category, probability){
              console.log(category)
              post.category = category;
              client.set('post:' + post.url, JSON.stringify(post))
            });
          }
          
        }
        res.send(200)
      }
    });
  });
}
