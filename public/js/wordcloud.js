$.ajax({
	url: '/get_words',
	type: 'GET',
	complete: function(req){
		var list = JSON.parse(req.responseText);


		var fontSize = d3.scale.log().range([10, 100]);
		
	}
});