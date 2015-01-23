var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    android_version: { type: String, required: true, label: 'Versión Android'},
    ios_version: { type: String, required: true, label: 'Versión iOS'}
});

schema.post('save', function (doc) {
	app.set('config_data', doc);
});

var model = module.exports = mongoose.model('config', schema);

model.formage = {
	is_single : true,
	label: 'Configuración'
};