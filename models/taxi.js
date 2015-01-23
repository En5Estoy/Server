var mongoose = require('mongoose'),
	Types = mongoose.Schema.Types,
	formage = require('formage'),
	_ = require('underscore');

/*
 = Se crean tarifas para una ciudad
- Ciudad
- Descripción
- Bajada de bandera
- Precio
- Cada cuanto se cobra

= Cuando se ingresa se piden las tarifas para la ciudad
= Cuando se va a calcular se envian los puntos y el tipo de tarifa seleccionado para hacer el calculo.
*/

var schema = mongoose.Schema({
	city: { type: Types.ObjectId, ref: 'city', required: true },
	title : { type: String, required: true },
	description : { type: String, required: true, label: 'Descripción' }, // Ej. Tarifa de 10 a 12
	initial_price : { type: Number, required: true },
	price: { type: Number, required: true },
	distance: { type: Number, required: true },
	updated_at : { type: Date, editable: false },
	created: { type: Date, 'default' : (new Date()), editable: false }
});

schema.pre('save', function(next) {
	// Update updated
	this.updated_at = (new Date());

	next();
});

var model = module.exports = mongoose.model('taxi', schema);
model.formage = {
	label : 'Tarifas Taxi',
	section: 'Taxi',
	filters: ['city'],
	search: ['city']
};