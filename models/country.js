var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = mongoose.Schema({
	name: { type: String, required: true, label: 'Nombre' },
	updated_at : { type: Date, editable: false },
	created: { type: Date, 'default' : (new Date()), editable: false }
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

var model = module.exports = mongoose.model('country', schema);
// Some another config over model
// model.XXXXXX

model.formage = {
	label : "País",
	section: 'Localización'
};