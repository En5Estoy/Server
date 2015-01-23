var Q = require('q'),
	mongoose = require('mongoose'),
	_ = require('underscore'),
	request = require('request');

/**
 * News
 */

module.exports = {
	init: function(app) {
		// Revisar como contestaba y contestar que es necesaria actualización
		// Ver si no era para el sitio web.
		app.post('/api/v1/weather', this.post.weather);

		// Run the helper that gets the weather.
		this.helpers.weather();
	},

	post : {
		weather : function(req, res ) {
			var d = Q.defer();

			d.promise
			.then(function(obj) {
				var d = Q.defer();

				mongoose.model('user').findOne({ udid: obj.udid }).exec(function(err, data) {
					if( err ) d.reject({ type: 'db', error: err });
					else d.resolve(_.extend(obj, { user: data }));
				});

				return d.promise;
			})
			.then(function(obj) {
				var d = Q.defer();

				mongoose.model('weather').findOne({ city: obj.user.city }).exec(function(err, data) {
					if( err ) d.reject({ type: 'db', error: err });
					else d.resolve(_.extend(obj, { data: data }));
				});

				return d.promise;
			})
			.then(function(obj) {
				res.json({
					result: true,
					data: obj.data.weather
				});
			})
			.fail(function(err) {
				res.json({
					result: false,
					error: err
				});
			});

			d.resolve(req.body);
		}
	},

	helpers: {
		// Get news every 30 minutes.
		weather: function() {
			this.loadWeather();
			setInterval(this.loadWeather, 30 * ( (60 * 1000) ) );
		},

		/**
		 * Weather Codes
		 * http://edg3.co.uk/snippets/weather-location-codes/
		 * 
		 */
		loadWeather: function() {
			//http://query.yahooapis.com/v1/public/yql?q=select%20item%20from%20weather.forecast%20where%20location='ARCA0023'&format=json
			var parser = require('parse-rss');
			var d = Q.defer();

			d.promise
				.then(function(obj) {
					// Get the User with the UDID
					var d = Q.defer();

					mongoose.model('weather').find().exec(function(err, data) {
						if (err) d.reject({
							type: 'db',
							error: err
						});
						else d.resolve(data);
					});

					return d.promise;
				})
				.then(function(obj) {
					_.each(obj, function(row) {
						var url = "http://query.yahooapis.com/v1/public/yql?q=select%20item%20from%20weather.forecast%20where%20location='" + row.code + "'&format=json";

						request({
							url: url,
							json: true
						}, function(error, response, body) {
							if (!error && response.statusCode == 200) {
								var cond = body.query.results.channel.item.condition;

								if( cond ) {
									row.weather = {
										code : cond.code,
										temp: parseFloat(( ( parseFloat(cond.temp) - 32) * 5/9 ).toFixed(1)),
										text: cond.text
									};

									//console.info(row.weather);
									row.save(function(err) {});
								}
							}
						});
					});
				});

			d.resolve({});
		}
	}
};