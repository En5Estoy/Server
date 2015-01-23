var Q = require('q'),
	mongoose = require('mongoose'),
	_ = require('underscore'),
	request = require('request');

/**
 * News
 */

module.exports = {
	init: function(app) {
		app.get('/api/docs', this.get.docs);
	},

	get: {
		docs: function(req, res) {
			res.render('api',  {});
		}
	}
};