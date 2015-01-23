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
	description: { type: String, required: false, default: '' },
	transport: { type: Types.ObjectId, ref: 'transport' },
	enabled: { type: Boolean, default: true },
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
	// If line was enabled or disabled
	// Update the others
	mongoose.model('stop').update({ line: doc._id }, { enabled: doc.enabled }, { multi: true }, function(err, numberAffected) {
		console.log('The number of updated documents was %d', numberAffected);
	});
});

var model = module.exports = mongoose.model('line', schema);
// Some another config over model
// model.XXXXXX

model.formage = {
	label : "Linea",
	section: 'Transporte'
};