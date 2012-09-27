

/**
 * Module dependencies.
 */

var express = require('express');
var haml = require('haml');
var RedisStore = require('connect-redis')(express);
var routes = require('./routes');
var redis = require('redis');

var client = redis.createClient();

client.on("error", function (err) {
        console.log("Error " + err);
});

var app = express.createServer();

// Configuration

var store = new RedisStore({});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'haml');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here', store: store }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.register('.haml', {
    compile: function(str, options) {
        return function(locals) {
            return haml.render(str, {locals: locals});
        }
    }
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/register', routes.register);
app.get('/setup', restrict, routes.setup);
app.get('/rate', restrict, routes.rate);
app.get('/getallposts', routes.getallposts);
app.get('/getposts', routes.getposts);
app.get('/recommend_data', routes.recommend_data);
app.get('/recommend', restrict,routes.recommend);
app.get('/classify_posts', routes.classify_posts);

app.get('/get_words', routes.get_words);
app.get('/wordcloud', routes.wordcloud);

app.post('/auth', routes.auth);
app.post('/registerpost', routes.registerpost);
app.post('/recrss', routes.recrss);
app.post('/reclike', routes.like);
app.post('/recdislike', routes.dislike);



app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
