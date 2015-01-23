var Q = require('q'),
    mongoose = require('mongoose'),
    _ = require('underscore');

/**
 * News
 */

module.exports = {
    init: function(app) {
        // Rutas API/v1 y las viejas
        app.get('/wrapget', wrap_get);
        app.get('/wrapimg/:session', wrap_image);
        app.post('/wrappost', wrap_post);

        // v1
        app.get('/api/v1/redbus/session', wrap_get);
        app.get('/api/v1/redbus/captcha/:session', wrap_image);
        app.post('/api/v1/redbus/send', wrap_post);
    }
};


var wrap_get = function(req, res) {
    var http = require('http');

    var options = {
        host: 'www.red-bus.com.ar',
        port: 80,
        path: '/consweb/movtj.php',
        method: 'GET',
    };

    var wreq = http.request(options, function(response) {
        console.log('STATUS: ' + response.statusCode);
        console.log('HEADERS: ' + JSON.stringify(response.headers));
        response.setEncoding('utf8');

        response.on('data', function(data) {});
        response.on('end', function() {
            console.info(response.headers['set-cookie'][0]);

            res.json({
                result: true,
                cookie: response.headers['set-cookie'][0].split(";").shift().split('=')[1]
            });
        });
    });

    wreq.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        res.json({
            result: false
        });
    });

    wreq.end();
};

var wrap_post = function(req, res) {
    var querystring = require('querystring'),
        http = require('http'),
        sys = require("sys");

    var post_data = querystring.stringify({
        varDNI: req.body.dni,
        varCARD: req.body.card,
        captcha: req.body.captcha
    });

    var options = {
        host: 'www.red-bus.com.ar',
        port: 80,
        path: '/consweb/movtj.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length,
            'Cookie': 'PHPSESSID=' + req.body.cookie
        }
    };

    var request = http.request(options, function(response) {
        //console.log('HEADERS: ' + JSON.stringify(response.headers));
        var html = "";

        response.on('data', function(data) {
            html += data;
        });

        response.on('end', function() {
            console.log(html);
            var cheerio = require('cheerio'),
                $ = cheerio.load(html);

            var tables = $('table');
            var rows = $(tables[1]).find('tr'); //$('tr', '', );
            var vals = $(rows[1]).find('td');

            console.info($(tables[0]));

            var details = [];
            _.each(_.rest(rows, 1), function(row) {
                var values = $(row).find('td');

                if( $(values[0]).text() == '' && $(values[1]).text() == '' && $(values[2]).text() == '' &&
                    $(values[3]).text() == '' && $(values[4]).text() == '' && $(values[5]).text() == '' ) {
                    return;
                }

                details.push({
                    date: $(values[0]).text(),
                    company: $(values[1]).text(),
                    line: $(values[2]).text(),
                    type: $(values[3]).text(),
                    ammount: $(values[4]).text(),
                    total: $(values[5]).text()
                });
            });

            res.json({
                result: true,
                data: {
                    date: $(vals[0]).text(),
                    company: $(vals[1]).text(),
                    line: $(vals[2]).text(),
                    type: $(vals[3]).text(),
                    ammount: $(vals[4]).text(),
                    balance: $(vals[5]).text()
                },
                details: details
            });
        });
    });

    request.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    request.write(post_data);

    request.end();
};

var wrap_image = function(req, res) {
    var http = require('http');

    var options = {
        host: 'www.red-bus.com.ar',
        port: 80,
        path: '/consweb/captcha.php',
        method: 'GET',
        headers: {
            'Cookie': 'PHPSESSID=' + req.params.session
        }
    };

    var wreq = http.request(options, function(response) {
        console.log('STATUS: ' + response.statusCode);
        console.log('HEADERS: ' + JSON.stringify(response.headers));
        res.set(response.headers);

        response.on('data', function(data) {
            res.write(data);
        });
        response.on('end', function() {
            res.end();
        });
    });

    wreq.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        res.json({
            result: false
        });
    });

    wreq.end();
};