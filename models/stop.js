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
	line: { type: Types.ObjectId, ref: 'line', required: true, label: 'Linea' },
	name: { type: String, required: false, label: 'Nombre' },
	type: { type: String, required: true, enum: ['going', 'return', 'no_way'], default: 'going'},
	order: { type: Number, required: true },
	street: {
		name: { type: String, required: true },
		number: { type: Number, default: 0 } // This must be removed
	},
	is_stop: { type: Boolean, default: true },
	location: { type: [Number], index: '2dsphere', required: true },
	schedule: [{ type: Types.Time }],
	enabled: { type: Boolean, default: false },
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

var model = module.exports = mongoose.model('stop', schema);

model.formage = {
	label : "Parada",
	section: 'Transporte',
	filters: ['line'],
	search: ['line', 'street']
};