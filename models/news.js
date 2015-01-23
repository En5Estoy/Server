var filename = __filename.slice(__filename.lastIndexOf('/') + 1, module.filename.length - 3);

var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = mongoose.Schema({
	city: { type: Types.ObjectId, ref: 'city', label: 'Ciudad' },
	url: { type: String, required: true, label: 'URL'},
	source: { type: String, required: true, label: 'Fuente'},
	news: { type: Types.Mixed, editable: false, default: [] },
	updated_at : { type: Date, editable: false },
	created: { type: Date, editable: false, hidden: true }
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

var model = module.exports = mongoose.model(filename, schema);
// Some another config over model

model.formage = {
	label: 'Noticias',
	section: 'Noticias',
	singular: 'Noticia'
};