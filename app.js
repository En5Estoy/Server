
/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path'),
  mongoose = require('mongoose'),
  _ = require('underscore'),
  swig = require('swig'),
  fs = require('fs'),
  formage = require('formage');

var app = express();

// Extending String
var S = require('string');
S.extendPrototype();

// Export app
GLOBAL.app = app;

var server = http.createServer(app);

// Template engine
app.engine('html', swig.renderFile);

// all environments
app.set('port', 5050);

// API Keys
app.set('gcm_key', 'AIzaSyAzhe880x2T1DwwAyyztCq4W8k7dtYj-UA');
app.set('foursquare', {
  client_id: '5TDJ4IANU4ENTYWC5CPV4SHINQGXAIHJ2UVHS3IR4345E4SG',
  client_secret: 'YXD4VUEXRTPQTPZVV3L4MKISFLTNBUR5DKVY51OQF3HNMF1Y'
});

app.set('salt', 'lamarencoche_cocheenmarla');

app.set('mongo', 'mongodb://localhost/e5e_database' );
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(app.get('salt')));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')(path.join(__dirname + '/public')));
app.use(express.static(path.join(__dirname, 'public')));

// Disable swig cache
app.set('view cache', false);

swig.setDefaults({ cache: false });

app.set('transport_types',  ['bus', 'subway', 'train', 'trolley', 'bike']);

app.configure('development', function(){
  app.use(express.errorHandler());
});

/*
 * Create connection to mongo
 */
mongoose.connect(app.get('mongo'));
var models = require('./models');

/*
 * Admin
 */
var admin = formage.init(app, express, models, {
  title: 'En 5 Estoy',
  root: '/admin',
  default_section: 'Config.',
  username: 'e5e',
  password: 'e5e_admin_e5e',
  admin_users_gui: true
});

// Enable full CORS
app.all('/*', function(req, res, next) {
  req.accepts('*');

  res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
  res.header('Access-Control-Allow-Credentials', 'true');

  next();
});

// Start the Router
require('./routes').init(app);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

process.on('uncaughtException', function (err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});
