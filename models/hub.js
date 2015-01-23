var filename = __filename.slice(__filename.lastIndexOf('/') + 1, module.filename.length - 3);
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
	city: { type: Types.ObjectId, ref: 'city', required: true, label: 'Ciudad' },
	location: { type: [Number], index: '2dsphere', required: true },
	enabled: { type: Boolean, default: false },
	updated_at : { type: Date, editable: false },
	created: { type: Date, editable: false }
});

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

var model = module.exports = mongoose.model(filename, schema);

model.formage = {
	label : "Concentrador",
	section: 'Transporte'
};