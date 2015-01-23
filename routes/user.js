var Q = require('q'),
    mongoose = require('mongoose'),
    _ = require('underscore');

module.exports = {
	init: function(app) {
		app.post('/api/v1/register_device', this.post.register);

		app.post('/api/v1/user/register', this.post.register);
	},

	post: {
		register: function(req, res) {
			// Buscar por palabra clave en tabla de ciudades para unir la ciudad
			// Search in Keywords
			// mongoose.model('city').find({keywords: req.body.city})
			// Esto hace que la app no tenga que conocer los ID's de las ciudades
			// Devolver las supported features de la ciudad: necesario para saber que activar y que desactivar en la app
			// Hacer listado de claves (enum)
			// Wizard de configuración de nueva ciudad ( o carga ). Al inicio de la primera vez oculta todo mientras configura la UI
			var d = Q.defer();

			d.promise
				.then(function(obj) {
					var d = Q.defer();

					mongoose.model('city').findOne({
						keywords: obj.city
					}).populate('state', 'name').select('-updated -created').exec(function(err, data) {
						if (err) d.reject({
							type: 'db',
							error: err
						});
						else d.resolve(_.extend(obj, {
							city: data
						}));
					});

					return d.promise;
				})
				.then(function(obj) {
					mongoose.model('user').findOne({
						udid: obj.udid
					}, function(err, data) {
						if (data != undefined) {
							if (obj.pid) {
								data.pid = obj.pid;
							}
							if (obj.city) {
								data.city = obj.city.id;
							}

							data.save(function(err) {
								if (err) d.reject({ type: 'db', error: err});
								else {
									res.json({
										result: true,
										city: obj.city
									});
								}
							});
						} else {
							mongoose.model('user').create({
								os: obj.os,
								udid: obj.udid,
								pid: obj.pid,
								city: obj.city.id
							}, function(err) {
								if (err) d.reject({ type: 'db', error: err});
								else {
									res.json({
										result: true,
										city: obj.city
									});
								}
							});
						}
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
	}
};