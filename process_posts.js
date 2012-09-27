var stopwords = require('./stopwords')
var redis = require('redis');

var client = redis.createClient();

client.on("error", function (err) {
        console.log("Error " + err);
});


exports.train_model_of_user = function(user, post, category) {
	client.get('model:' + user.username, function(err, raw){
		var model = JSON.parse(raw);
		var words = split_words(post.content);

		inc_category(category, model);

		for (var i = 0; i < words.length; i++) {
			var word = words[i]
			if (word !== undefined) {
				inc_word(word, category, model);
			}
		}

		client.set('model:' + user.username, JSON.stringify(model));
	});
}

function inc_category(category, model) {
	model.totalNumberOfPosts += 1;
	if (category === 'like') {
		model.numberOfPostsLiked += 1;
	} else if (category === 'dislike') {
		model.numberOfPostsDisliked += 1;
	}
}

function inc_word(word, category, model) {
	if (category === 'like') {
		model.words.like[word] |= 0;
		model.words.like[word] += 1;
	} else if (category === 'dislike') {
		model.words.dislike[word] |= 0;
		model.words.dislike[word] += 1;
	}
}

function split_words(string) {
	string = string.replace(/[\(\)'";:,.\/?\\-]/g, '');
	string = string.replace(/\s{2,}/g, ' ');
	var words_string = string.split(' ');
	var words = [];
	for (var i = 0; i < words_string.length; i++) {
		word = words_string[i];
		word = word.toLowerCase();
		if (!stopwords.is_stopword(word)) {
			words.push(word);
		}
	};

	return words;
}



exports.classify = function(post, username, callback) {
	client.get('model:' + username, function(err, raw){
			
		var model = JSON.parse(raw);

		var default_cat = 'dislike';
		var max_prob = 0.0;
		var best_category = undefined;

		var scores = category_scores(post, model);

		
		for (var i = 0; i < scores.length; i++) {
			var score = scores[i];

			var category = score[0];
			var probability = score[1];
			
			if (probability > max_prob){
				max_prob = probability;
				best_category = category;
			}

		}

		if (best_category != undefined) callback(best_category, max_prob);


		for (var i = 0; i < scores.length; i++) {
			var score = scores[i];

			var category = score[0];
			var probability = score[1];

			if (category === best_category) break;
  				

  			if (probability > max_prob) return default_cat
  		}
  		
  		callback(best_category, max_prob);
	
	});
}


function category_scores(post, model){

	var probabilities = {};
	var probs = [];

	for (key in model.words){
		probabilities[key] = text_probability(post, key, model);
	}

	for (key in probabilities){
      probs.push([key, probabilities[key]]);
    }

	return probs;
}



function text_probability(post, category, model){

	if (category === 'like') {
  		var category_probability = model.numberOfPostsLiked / model.totalNumberOfPosts;
	} else {
  		var category_probability = model.numberOfPostsDisliked / model.totalNumberOfPosts;
	}

	var doc_prob = document_probability(post, category, model);

	return category_probability * doc_prob;

}


function document_probability(post, category, model) {
	var m_arr = [];
	var words = split_words(post.content);

	for (var i = 0; i < words.length; i++) {
		var word = words[i]
		if (word !== undefined){
			m_arr.push(word_weighted_average(word, category, model));

		}
	}

	
	m_arr = m_arr.inject(1, function(p, c) { return p * c; });

	return m_arr
}

function word_weighted_average(word, category, model) {
	var weight = 1.0;
    var assumed_prob = 0.5;

    var basic_probability = word_probability(word, category, model);

    word_in_likes = parseFloat(model.words["like"][word]) | 0.0;
    word_in_dislikes = parseFloat(model.words["dislike"][word]) | 0.0;
    total_word = word_in_likes + word_in_dislikes;


    return (weight * assumed_prob + total_word * basic_probability) / (weight + total_word);
}

function word_probability(word, category, model) {
	return word_count(word, category, model) / 2.0		// num of categories
}


function word_count(word, category, model) {
	return model.words[category][word] | 0.0
}


Array.prototype.inject = function(memo, iterator) {
    this.each(function(value, index) {
      memo = iterator(memo, value, index);
    });
    return memo;
  }


Array.prototype.each = function(iterator) {
    var index = 0;
    try {
      this._each(function(value) {
        iterator(value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  }

  Array.prototype._each = function(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  }
