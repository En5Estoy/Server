var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = mongoose.Schema({
	name: { type: String, required: true, label: 'Ciudad'},
	state: { type: Types.ObjectId, ref: 'state', label: 'Provincia' },
	keywords: [{type: String, label: 'Nombre Clave'}],
	features: [{type: String, label: 'Característica', enum : ['transport', 'transport_calculate', 'transport_lines', 'transport_prices', 'taxi', 'commerce', 'redbus', 'notifications', 'news', 'weather']}],
	transports: [{ type: String, label: 'Transporte disponible', enum: app.get('transport_types')}],
	search: { type: String, required: true},
	enabled: { type: Boolean, required: true, default: true},
	updated_at : { type: Date, editable: false },
	created: { type: Date, 'default' : (new Date()), editable: false, hidden: true }
});

schema.methods.toString = function() {
    return this.name;
};

schema.pre('save', function(next) {
	// Update updated
  	this.updated_at = (new Date());

  	next();
});

schema.post('save', function (doc) {
	
});

var model = module.exports = mongoose.model('city', schema);
// Some another config over model

model.formage = {
	label: 'Ciudad',
	section: 'Localización',
	singular: 'Ciudad'
};