var Q = require('q'),
    mongoose = require('mongoose'),
    _ = require('underscore');

/**
 * Taxis
 */

module.exports = {
    init: function(app) {
        app.post('/api/v1/taxi', taxi_travel);

        // Old API
        app.post('/api/taxi', old_taxi_travel);
        // Ruta a la vieja API y dejarla andando un tiempo
    }
};

var isNumber = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};

/**
 * Calcula el precio del Taxi
 *
 * @param  Object req
 * @param  Object res
 *
 */
var taxi_travel = function(req, res) {
    var request = require('request');
    var querystring = require('querystring');

    /**
     * Params
     * - address_from
     * - address_to
     * - gps_from
     * - gps_to
     * - UDID
     */

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
            var d = Q.defer();

            mongoose.model('taxi').find({
                city: obj.user.city.id
            }).exec(function(err, data) {
                if (err) d.reject({
                    type: 'db',
                    error: 'No hay taxis para la ciudad buscada.'
                });
                else d.resolve(_.extend(obj, {
                    prices: data
                }));
            });

            return d.promise;
        }).then(function(obj) {
            var d = Q.defer();

            obj.data = {};

            obj.data.from = obj.address_from;
            obj.data.to = obj.address_to;

            var current_city = obj.user.city.name + ', ' + obj.state.name + ', ' + obj.state.country.name;

            console.info(current_city);

            // From GPS
            if (obj.data.from == undefined) {
                obj.data.from = obj.gps_from;
            } else {
                obj.data.from = obj.data.from + ',' + current_city;
            }

            // From GPS
            if (obj.data.to == undefined) {
                obj.data.to = obj.gps_to;
            } else {
                obj.data.to = obj.data.to + ',' + current_city;
            }

            obj.data.query = querystring.stringify({
                origin: obj.data.from,
                destination: obj.data.to
            });

            request('http://maps.googleapis.com/maps/api/directions/json?' + obj.data.query + '&sensor=false&language=es', function(error, response, body) {
                var parsed_response = JSON.parse(body);
                if (!error && response.statusCode == 200 && parsed_response.status != 'INVALID_REQUEST') {
                    d.resolve(_.extend(obj, {
                        directions: parsed_response
                    }));
                } else {
                    d.reject({
                        type: 'gmaps',
                        err: 'Error al obtener las rutas.'
                    });
                }
            });

            return d.promise;
        }).then(function(obj) {
            var json_data = obj.directions;

            var caminos = json_data.routes[0].legs;
            if (caminos.length > 0) {
                var total_mts = caminos[0].distance.value;

                var data = {
                    start_address: caminos[0].start_address,
                    end_address: caminos[0].end_address,
                    mts: total_mts,
                    mts_string: caminos[0].distance.text,
                    duration: caminos[0].duration.text,
                    steps: caminos[0].steps,
                    prices: []
                };

                _.each(obj.prices, function(row) {
                    var bajada = parseFloat(row.initial_price);
                    var price = parseFloat(row.price);
                    var mts_fraction = parseFloat(row.distance);

                    var total_price = (bajada + ((total_mts / mts_fraction) * price));

                    data.prices.push({
                        name: row.title,
                        description: row.description,
                        price: Number(total_price).toFixed(2)
                    });
                });

                res.json({
                    result: true,
                    data: data
                });

                console.info(data);
            } else {
                d.reject({
                    type: 'no_directions',
                    error: 'No hay rutas para los parámetros buscados.'
                });
            }
        }).fail(function(err) {
            res.json({
                result: false,
                error: err
            });
        });

    // Start data processing...
    d.resolve(req.body);
};

var old_taxi_travel = function(req, res) {
    var request = require('request');
    var querystring = require('querystring');

    var from = req.body.address_from;
    var to = req.body.address_to;

    // From GPS
    if (from == undefined) {
        from = req.body.gps_from;
    } else {
        from = from + ', Córdoba, Argentina';
    }

    // From GPS
    if (to == undefined) {
        to = req.body.gps_to;
    } else {
        to = to + ', Córdoba, Argentina';
    }

    var query = querystring.stringify({
        origin: from,
        destination: to
    });

    request('http://maps.googleapis.com/maps/api/directions/json?' + query + '&sensor=false&language=es', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var json_data = JSON.parse(body);

            var caminos = json_data.routes[0].legs;
            if (caminos.length > 0) {
                var total_mts = caminos[0].distance.value;

                var bajada = 8.68;
                var price = 0.434;
                var mts_fraction = 110;

                var total_price = (bajada + ((total_mts / mts_fraction) * price));

                res.json({
                    result: true,
                    data: {
                        start_address: caminos[0].start_address,
                        end_address: caminos[0].end_address,
                        price: Number(total_price).toFixed(2),
                        mts: total_mts,
                        mts_string: caminos[0].distance.text,
                        duration: caminos[0].duration.text,
                        steps: caminos[0].steps
                    }
                });
            } else {
                res.json({
                    result: false
                });
            }
        }
    });
};