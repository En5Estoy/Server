var filename = __filename.slice(__filename.lastIndexOf('/') + 1, module.filename.length - 3);

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
	type: { type: String, required: true, label: 'Tipo de Transporte', enum: app.get('transport_types'), default: 'bus'},
	description : { type: String, required: true, label: 'Descripción' }, // Ej. Tarifa de 10 a 12
	price: { type: Number, required: true },
	updated_at : { type: Date, editable: false },
	created: { type: Date, 'default' : (new Date()), editable: false }
});

schema.pre('save', function(next) {
	// Update updated
	this.updated_at = (new Date());

	next();
});

var model = module.exports = mongoose.model(filename, schema);
model.formage = {
	label : 'Precios',
	section: 'Transporte',
	filters: ['city', 'type'],
	search: ['city', 'type']
};