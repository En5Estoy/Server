var Q = require('q'),
	mongoose = require('mongoose'),
	_ = require('underscore'),
	request = require('request');

/**
 * News
 */

module.exports = {
	init: function(app) {
		app.post('/api/v1/cities/address', this.post.address);
		app.get('/api/v1/cities', this.get.cities);
	},

	post: {
		address: function(req, res) {
			var d = Q.defer();

			d.promise
				.then(function(obj) {
					var d = Q.defer();

					console.info(obj);

					mongoose.model('user').findOne({
						udid: obj.udid
					}).populate('city').exec(function(err, data) {
						if (err) d.reject({
							type: 'db',
							error: err
						});
						else d.resolve(_.extend(obj, {
							user: data
						}));
					});

					return d.promise;
				})
				.then(function(obj) {
					var d = Q.defer();

					console.info(obj);

					mongoose.model('state').findById(obj.user.city.state).populate('country').exec(function(err, data) {
						console.info(err);
						console.info(data);
						if (err) d.reject({
							type: 'db',
							error: 'No se pudo encontrar el estado buscado.'
						});
						else d.resolve(_.extend(obj, {
							state: data
						}));
					});

					return d.promise;
				}).then(function(obj) {
					var current_city = obj.user.city.name + ', ' + obj.state.name + ', ' + obj.state.country.name;

					res.json({
						result: true,
						address: current_city
					})
				}).fail(function(err) {
					res.json({
						result: false,
						error: err
					});
				});

			// Start data processing...
			d.resolve(req.body);
		}
	},

	get: {
		cities: function(req, res) {
			var d = Q.defer();

			d.promise
				.then(function(obj) {
					var d = Q.defer();

					mongoose.model('city').find({ enabled: true }).populate('state', 'name').select('name _id features state').sort('name').exec(function(err, data) {
						if (err) d.reject({
							type: 'db',
							error: err
						});
						else d.resolve(_.extend(obj, {
							data: data
						}));
					});

					return d.promise;
				})
				.then(function(obj) {
					res.json({
						result: true,
						data: obj.data
					});
				})
				.fail(function(err) {
					res.json({
						result: false,
						error: err
					});
				});

			d.resolve({});
		}
	}
};