var Q = require('q'),
	mongoose = require('mongoose'),
	_ = require('underscore'),
	request = require('request');

/**
 * News
 */

module.exports = {
	init: function(app) {
		app.get('/app/routes/editor', this.get.routes);

		app.get('/app/routes/editor/lines/:transport', this.get.lines);
		app.get('/app/routes/editor/stops/:line/:type', this.get.stops);

		app.get('/app/routes/editor/geocode/:lat/:lng', this.get.geocode);

		app.post('/app/routes/editor/stops', this.post.stops);
	},

	get: {
		routes: function(req, res) {
			mongoose.model('transport').find({}, function(err, data) {
				res.render('editor',  {
					transport: data
				});
			});
		},

		lines: function(req, res) {
			mongoose.model('line').find({ transport: req.params.transport }, function(err, data) {
				res.json({
					data: data
				});
			});
		},

		stops: function(req, res) {
			mongoose.model('stop').find({ line: req.params.line, type: req.params.type }).sort('field order').exec(function(err, data) {
				res.json({
					data: data
				});
			});	
		},

		geocode: function(req, res) {
			request({
				url: 'http://dev.virtualearth.net/REST/v1/Locations/' + req.params.lat + ',' + req.params.lng + '?o=json&key=ArvOKlxJqyKw4rCaCKx0H-ra-KfmXIR8KQup-hqh7HxZ485kmA9ggFlgC2ZSBUFu',
				json: true
			}, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					console.info(body);

					try {
						res.json( body.resourceSets[0].resources[0].address );
					} catch( e ) {
						res.json({
							result: false
						});
					}
				}
			});
		}
	},

	post : {
		stops: function(req, res) {
			console.info(req.body);
			var Stop = mongoose.model('stop');
			Stop
				.remove({
					line: req.body.line, type: req.body.type
				}, function(err) {
					console.error(err);
					if( err ) {
						res.json({ result: false });
					} else {
						Stop.create(req.body.locations, function(err) {
							console.error(err);
							if( err ) {
								res.json({ result: false });
							} else {
								res.json({ result: true });
							}
						});
					}
				} );
		}
	}
};