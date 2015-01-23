var Q = require('q'),
	mongoose = require('mongoose'),
	_ = require('underscore'),
	Foursquare = require('node-foursquare')({
		'locale': 'es',
		'secrets': {
			'clientId': app.get('foursquare').client_id,
			'clientSecret': app.get('foursquare').client_secret,
			'redirectUrl': 'http://54.243.218.97:3000'
		}
	});

module.exports = {
	init: function(app) {
		app.get('/api/v1/commerce/categories', this.get.categories);
		app.post('/api/v1/commerce/search', this.post.commerces);

		app.post('/api/v1/commerce/recommendations', this.post.recommendations);

		// Old API
		app.get('/api/v1/interesting_points_categories', this.get.categories);
		app.get('/api/v1/interesting_points', this.post.commerces);

		this.helpers.categories();
	},
	get: {
		// Cache this query
		categories: function(req, res) {
			res.json({
				result: true,
				categories: app.get('foursquare_categories')
			});
		}
	},
	post: {
		recommendations: function(req, res) {
			// Obtener UDID y devolver lugares recomendados segun la ciudad
			// Especial para lugares que pagaron
			// Mostrar debajo de la búsqueda de comercios o en la home entre las opciones
			// Enviar la hora actual en el equipo para que mediante franjas horarias saber que recomendar
		},

		commerces: function(req, res) {
			console.info(req.body);

			var params = {
				locale: 'es'
			};

			if( req.body.search.trim() != '' ) {
				params.query = req.body.search;
				params.radius = 1000;
			}

			if( req.body.category && req.body.category != -1 ) {
				params.categoryId = req.body.category;
				params.radius = 500;
			}

			Foursquare.Venues.search(parseFloat(req.body.lat), parseFloat(req.body.lon), null, params, '', function(error, data) {
				console.info(data);
				console.error(error);
				if (error) {
					res.json({
						result: false
					});
				} else {
					res.json(data);
				}
			});
		}
	},
	helpers: {
		// Get news every 30 minutes.
		categories: function() {
			this.loadCategories();
			setInterval(this.loadCategories, 30 * ( (60 * 1000) ) );
		},

		/**
		 * Load Categories and cache them
		 * 
		 */
		loadCategories: function() {
			Foursquare.Venues.getCategories({
				locale: 'es'
			}, '', function(error, data) {
				if (error) {
				} else {
					var f_data = [];

					_.each(data.categories, function(r) {
						f_data.push( _.pick(r, 'id', 'name') );
					});

					app.set('foursquare_categories', f_data);
				}
			});
		}
	}
};

exports.edit = function(req, res) {
	/*
	number = request.POST.get('number')

    unif = CommerceUnification.objects.get_or_create(venue_id=request.POST.get('vid'))
    unif[0].phone = number
    unif[0].save()
	 */
};