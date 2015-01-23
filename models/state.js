var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = mongoose.Schema({
	name : { type: String, required: true, label: 'Nombre' },
	country : { type: Types.ObjectId, ref: 'country', required: true },
	updated_at : { type: Date, editable: false },
	created: { type: Date, 'default' : (new Date()), editable: false }
});

schema.methods.toString = function() {
    return ( this == undefined ) ? "No hay elementos" : this.name;
};

schema.pre('save', function(next) {
	// Update updated
  	this.updated_at = (new Date());

  	next();
});

schema.post('save', function (doc) {
	
});

var model = module.exports = mongoose.model('state', schema);
// Some another config over model
// model.XXXXXX

model.label = 'Provincia';
model.singular = 'Provincia';
model.formage = {
	section: 'Localización'
};