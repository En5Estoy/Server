var Q = require('q'),
	mongoose = require('mongoose'),
	_ = require('underscore'),
	request = require('request');

/**
 * News
 */

module.exports = {
	init: function(app) {
		app.get('/', this.get.app);

		app.get('/api/v1/geocode/:address', this.get.geocode);
	},

	get: {
		app: function(req, res) {
			res.render('index',  {});
		},

		geocode: function(req, res) {
			request({
				url: 'http://maps.googleapis.com/maps/api/geocode/json?sensor=true&address=' + req.params.address,
				json: true
			}, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					try {
						res.json( body );
					} catch( e ) {
						res.json({
							result: false
						});
					}
				}
			});
		}
	}
};