var Q = require('q'),
	mongoose = require('mongoose'),
	_ = require('underscore');

/**
 * News
 */

module.exports = {
	init: function(app) {
		// Revisar como contestaba y contestar que es necesaria actualización
		// Ver si no era para el sitio web.
		app.get('/news', this.get.news);
		app.post('/api/v1/notifications', this.get.notifications);
		app.post('/api/v1/news', this.get.news);

		// URL por la que pasen todas las URL's llamadas y el UDID del usuario

		// Run the helper that gets the news.
		this.helpers.news();
	},

	get : {
		/**
		 * @todo Si no hay ciudad devolver por defecto Córdoba
		 */
		news : function(req, res ) {
			// Real news
			
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

				mongoose.model('news').findOne({ city: obj.user.city }).exec(function(err, data) {
					if( err ) d.reject({ type: 'db', error: err });
					else d.resolve(_.extend(obj, { news: data }));
				});

				return d.promise;
			})
			.then(function(obj) {
				console.info(obj);
				res.json({
					result: true,
					data: obj.news.news
				});
			})
			.fail(function(err) {
				res.json({
					result: false,
					error: err
				});
			});

			d.resolve(req.body);
		},

		notifications: function(req, res) {
			var d = Q.defer();

			d.promise
			.then(function(obj) {
				// Get the User with the UDID
				var d = Q.defer();

				mongoose.model('user').findOne({ udid: obj.udid }).exec(function(err, data) {
					if( err ) d.reject({ type: 'db', error: err });
					else d.resolve(_.extend(obj, { user: data }));
				});

				return d.promise;
			})
			.then(function(obj) {
				var d = Q.defer();

				mongoose.model('notification').find()
					.or([{ city: obj.user.city }, { city: undefined }])
					.populate('city').exec(function(err, data) {
					if( err ) d.reject({ err: 'db', error: err });
					else d.resolve(data);
				});

				return d.promise;
			}).then(function(obj) {
				res.json({
					result: true,
					data: obj
				});
			}).fail(function(err) {
				res.json({
					result: false,
					err: err
				});
			});

			d.resolve(req.body);
		}
	},

	helpers: {
		// Get news every 30 minutes.
		news: function() {
			this.loadNews();
			setInterval(this.loadNews, 30 * ( (60 * 1000) ) );
		},

		loadNews : function() {
			var parser = require('parse-rss');
			var d = Q.defer();

			d.promise
			.then(function(obj) {
				// Get the User with the UDID
				var d = Q.defer();

				mongoose.model('news').find().exec(function(err, data) {
					if( err ) d.reject({ type: 'db', error: err });
					else d.resolve(data);
				});

				return d.promise;
			})
			.then(function(obj) {
				_.each(obj, function(row) {
					parser(row.url, function(err, data) {
						var pd = [];

						_.each(data, function(rr) {
							pd.push({
								title: rr.title,
								//description: rr.summary.stripTags(),
								url: rr.link
							});
						});

						row.news = pd;
						//console.info(pd);
						row.save(function(err) {});
					});
				});
			});

			d.resolve({});
		}
	}
};