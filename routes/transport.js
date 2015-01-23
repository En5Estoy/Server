var Q = require('q'),
	mongoose = require('mongoose'),
	_ = require('underscore');

/*
 Busses routes
*/

var calc = 6371000;

var solve = function(request_body) {
	"use strict";

	// Defer to be returned
	var md = Q.defer();

	var d = Q.defer();

	d.promise
		.then(function(obj) {
			var d = Q.defer();

			mongoose
				.model('stop')
				.find({
					enabled: true
				})
				.where('location').near({
					center: [parseFloat(obj.to_lon), parseFloat(obj.to_lat)],
					maxDistance: (1000 / calc),
					spherical: true
				})
				.lean(true)
				.exec(function(err, locations) {
					if(err) d.reject();
					else {
						d.resolve(_.extend(obj, {
							end_points: _.uniq(_.pluck(locations, 'line'))
						}));
					}
				});

			return d.promise;
		})
		.then(function(obj) {

			mongoose
				.model('stop')
				.geoNear([parseFloat(obj.lon), parseFloat(obj.lat)], {
					maxDistance: (1000 / calc),
					spherical: true,
					distanceField: 'location',
					query: {
						line: {
							$in: obj.end_points
						},
						enabled: true
					}
				}, function(err, locations, stats) {
					if(err) {
						md.reject(_.pick(request_body, 'lat', 'lon', 'to_lat', 'to_lon', 'udid'));
						return;
					}

					var results = {};

					var defers = [];

					_.each(locations, function(location) {
						var ld = Q.defer();

						mongoose
							.model('stop')
							.geoNear([parseFloat(obj.to_lon), parseFloat(obj.to_lat)], {
								maxDistance: (1000 / calc),
								spherical: true,
								distanceField: 'location',
								query: {
									type: location.obj.type,
									line: location.obj.line,
									order: {
										$gt: location.obj.order
									},
									enabled: true
								},
								num: 1,
								populate: 'line'
							}, function(err, rst, sts) {
								if (rst != undefined) {
									var from = rst[0];

									if (_.isUndefined(from) || _.isNull(from)) {
										ld.resolve();

										return;
									}

									if (!_.has(from, "dis")) {
										ld.resolve();

										return;
									}

									// Improve the data creating a new object
									var obj = {
										to: {
											distance_string: (from.dis * calc).toFixed(2),
											distance: from.dis,
											location: {
												lat: from.obj.location[1],
												lon: from.obj.location[0]
											},
											street: from.obj.street,
											type: from.obj.type
										},
										from: {
											distance_string: (location.dis * calc).toFixed(2),
											distance: location.dis,
											location: {
												lat: location.obj.location[1],
												lon: location.obj.location[0]
											},
											street: location.obj.street,
											type: location.obj.type
										}
									};

									mongoose.model('line').findById(from.obj.line, 'name description enabled transport').populate({
										path: 'transport',
										select: 'name description type'
									}).exec(function(err, line_data) {
										obj.line = line_data;

										if (results[from.obj.line] == undefined) {
											results[from.obj.line] = [];
										}
										results[from.obj.line].push(obj);

										ld.resolve();
									});


								} else {
									ld.resolve();
								}
							});

						defers.push(ld.promise);
					});

					Q.all(defers).then(function() {
						if (_.isEmpty(results)) {
							md.reject(_.pick(request_body, 'lat', 'lon', 'to_lat', 'to_lon', 'udid'));

							return;
						}

						// Pre-Filter
						_.each(results, function(value, key) {
							results[key] = _.sortBy(value, function(obj) {
								return obj.from.distance + obj.to.distance;
							});
						});

						var f_results = [];

						// Add just the best result
						var keys = _.keys(results);
						_.each(keys, function(key) {
							f_results.push(results[key][0]);
						});

						// Sort by first position
						var r_sort = _.sortBy(f_results, function(obj) {
							return obj.from.distance + obj.to.distance;
						});

						md.resolve(r_sort);
					});
				});
		}).fail(function() {
			md.reject(_.pick(request_body, 'lat', 'lon', 'to_lat', 'to_lon', 'udid'));
		});

	d.resolve(request_body);

	return md.promise;
};

module.exports = {
	init: function(app) {
		app.post('/api/v1/transport/calculate', this.post.calculate);
		// Lineas y recorridos
		app.post('/api/v1/transport/lines', this.post.lines);
		app.post('/api/v1/transport/stops', this.post.stops);

		app.post('/api/v1/streets', this.post.streets);
	},

	get: {

	},

	post: {
		/**
		 * Get Streets
		 *
		 * @param  {[type]} req [description]
		 * @param  {[type]} res [description]
		 * @return {[type]}     [description]
		 */
		streets: function(req, res) {

		},

		/**
		 * Receives UDID and replies with data for the City
		 *
		 * @param  {[type]} req [description]
		 * @param  {[type]} res [description]
		 * @return {[type]}     [description]
		 */
		lines: function(req, res) {
			// Tipo de transporte y udid
			var d = Q.defer();

			d.promise.then(function(obj) {
				var d = Q.defer();

				mongoose.model('user').findOne({ udid: obj.udid }).exec(function(err, data) {
					console.info(data);
					if( err ) d.reject({ type: 'db', error: err });
					else d.resolve(_.extend(obj, { user: data }));
				});

				return d.promise;
			}).then(function(obj) {
				var d = Q.defer();

				mongoose
					.model('line')
					.find({})
					.populate({
  						path: 'transport',
  						match: { city: obj.user.city },
  						select: 'name type city'
					})
					.select('id name description transport enabled')
					.sort('name')
					.exec(function(err, data) {
						data = _.filter(data, function(row) {
							return ( row.transport.city.toString() == obj.user.city.toString() && row.transport.type != 'bike' && row.enabled );
						});

					if (err) d.reject({
						type: 'db',
						error: err
					});
					else d.resolve(_.extend(obj, {
						lines: data
					}));
				});

				return d.promise;
			})
			.then(function(obj) {
				res.json({
					result: true,
					data: obj.lines
				});
			})
			.fail(function(obj) {
				res.json({
					result: false,
					error: err
				});
			});

			d.resolve(req.body);
		},

		/**
		 * Receives UDID and replies with data for the City
		 *
		 * @param  {[type]} req [description]
		 * @param  {[type]} res [description]
		 * @return {[type]}     [description]
		 */
		stops: function(req, res) {
			// Tipo de transporte y udid
			var d = Q.defer();

			d.promise.then(function(obj) {
				var d = Q.defer();

				mongoose.model('stop').find({
					line: obj.line,
					type: 'going'
				}, 'order location street type', {
					sort: {
						order: 1
					}
				}, function(err, data) {
					if (err) d.reject({
						type: 'db',
						error: err
					});
					else d.resolve(_.extend(obj, {
						go: data
					}));
				});

				return d.promise;
			}).then(function(obj) {
				var d = Q.defer();

				mongoose.model('stop').find({
					line: obj.line,
					type: 'return'
				}, 'order location street type', {
					sort: {
						order: 1
					}
				}, function(err, data) {
					if (err) d.reject({
						type: 'db',
						error: err
					});
					else d.resolve(_.extend(obj, {
						ret: data
					}));
				});

				return d.promise;
			})
			.then(function(obj) {
				var d = Q.defer();

				mongoose.model('stop').find({
					line: obj.line,
					type: 'no_way'
				}, 'order location street type',{
					sort: {
						order: 1
					}
				}, function(err, data) {
					if (err) d.reject({
						type: 'db',
						error: err
					});
					else d.resolve(_.extend(obj, {
						nw: data
					}));
				});

				return d.promise;
			})
			.then(function(obj) {
				res.json({
					result: true,
					going: ( obj.go != undefined ) ? obj.go : obj.nw,
					return: obj.ret
				});
			})
			.fail(function(obj) {
				res.json({
					result: false,
					error: err
				});
			});

			d.resolve(req.body);
		},

		/**
		 * Get Stops
		 *
		 * @param  {[type]} req [description]
		 * @param  {[type]} res [description]
		 * @return {[type]}     [description]
		 */
		calculate: function(req, res) {
			//  { type : "Point" , coordinates : [ <longitude> , <latitude> ] }
			/**
			 * Pedir los del primero por cercania
			 * Pedir los del segundo por cercania y que esten en el primero ( IN )
			 * Del segundo solo dejar los mas cercanos al inicio
			 *
			 * Recorrer y ver cuales lineas coinciden y si el orden es mayor. Usar underscore para filtrar
			 *
			 * Si hay directo contestar.
			 *
			 * Si no hay nada de ambos hay que revisar alreves, ver todas la lineas de destino y buscar lineas que se crucen con la de llegada.
			 */

			(solve(req.body))
			.then(function(obj) {
				// No empty so just reply
				
				res.json(obj);
			})
			.fail(function(data) {
				// If no udid just return an empty message
				if( !_.has(data, "udid") ) {
					// Old app without support for Combinations
					res.json([]);

					return;
				}

				// The research failed so we need to get the hubs
				var d = Q.defer();

				d.promise.then(function(obj) {
					var d = Q.defer();

					mongoose.model('user').findOne({ udid: obj.udid }).exec(function(err, data) {
						if( err ) d.reject({ type: 'db', error: err });
						else d.resolve(_.extend(obj, { user: data }));
					});

					return d.promise;
				}).then(function(obj) {
					var d = Q.defer();

					// Buscar el HUB en la misma ciudad más cercano al punto de salida.
					// Ordernar por la distancia.
					mongoose.model('hub').find({ city: obj.user.city }).exec(function(err, data) {
						if( err ) d.reject({ type: 'db', error: err });
						else d.resolve(_.extend(obj, { hubs: data }));
					});

					return d.promise;
				}).then(function(obj) {
					// So... here we have the hubs... lets try the solve
					var defers = [];

					var results = [];

					_.each(obj.hubs, function(hub) {
						var rd = Q.defer();

						var dhubs = [];

						dhubs.push( (solve({
							lat: obj.lat,
							lon: obj.lon,
							to_lat: hub.location[1],
							to_lon: hub.location[0]
						}) ) );

						dhubs.push( (solve({
							lat: hub.location[1],
							lon: hub.location[0],
							to_lat: obj.to_lat,
							to_lon: obj.to_lon
						}) ) );

						Q.all(dhubs).then(function(result){
							// De los resultados de los hubs... solo los 3 mejores y combinar

							for( var r1 = 0 ; r1 < result[0].length ; r1++ ) {
								var start_result = result[0][r1];

								for( var r2 = 0 ; r2 < result[1].length ; r2++ ) {
									var end_result = result[1][r2];
								
									var csr = _.clone(start_result);
									csr.to.distance = start_result.to.distance + end_result.from.distance;
									csr.to.distance_string = (csr.to.distance * calc).toFixed(2);

									var cer = _.clone(end_result);
									cer.from.distance = 0;
									cer.from.distance_string = "0";

									var steps = [];
									steps.push(csr);
									steps.push(cer);

									results.push({
										steps: steps,
										total: (start_result.from.distance + start_result.to.distance + end_result.from.distance + end_result.to.distance),
										total_string: ((start_result.from.distance + start_result.to.distance + end_result.from.distance + end_result.to.distance) * calc).toFixed(2)
									});
								}
							}

							rd.resolve();
						}).fail(function() {
							res.json([]);
						});

						defers.push(rd.promise);
					});

					Q.all(defers).then( function() {
						// Sort by total of meters of results
						var r_sort = _.sortBy(results, function(obj) {
							return obj.total;
						});

						var r_filter = _.filter(r_sort, function(obj) {
							return (obj.total < (1000 / calc));
						});

						if( r_filter.length > 0 ) {
							res.json(r_filter);
						} else {
							res.json(r_sort);
						}
					});
				}).fail(function(err) {
					res.json(err);
				});

				d.resolve(data);
			});
		}
	}

};