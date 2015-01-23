var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = mongoose.Schema({
	name: { type: String, required: true, label: 'Calle'},
	city: { type: Types.ObjectId, ref: 'city', label: 'Ciudad' },
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

var model = module.exports = mongoose.model('street', schema);
// Some another config over model

model.formage = {
	label: 'Calle',
	section: 'Localización',
	singular: 'Calle'
};