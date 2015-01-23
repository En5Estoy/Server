/*
Transporte de Linea como ahora, agregando Líneas por separado
Quedaría:
- Empresa
	- Tipo de transporte: colectivo, subte, tren, trolebus
- Línea
- Paradas
- Horarios: puede o no referenciar a una parada.
*/

var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = mongoose.Schema({
	name: { type: String, required: true, label: 'Nombre' },
	type: { type: String, required: true, enum: app.get('transport_types'), default: 'bus'},
	city: { type: Types.ObjectId, ref: 'city', label: 'Ciudad' },
	description: { type: String, required: false, default: '' },
	extras: { type: Types.Mixed }, // Extras for internal or file references
	updated_at : { type: Date, editable: false },
	created: { type: Date, editable: false }
});

schema.methods.toString = function() {
    return this.name;
};

schema.pre('save', function(next) {
	// Update updated
	this.updated_at = (new Date());

	if (!this.created) {
		this.created = new Date();
	}

	next();
});

schema.post('save', function (doc) {
	
});

var model = module.exports = mongoose.model('transport', schema);
// Some another config over model
// model.XXXXXX

model.formage = {
	label : "Transporte",
	section: 'Transporte'
};