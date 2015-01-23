// Use filename as the model
var filename = __filename.slice(__filename.lastIndexOf('/') + 1, module.filename.length - 3);

var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = mongoose.Schema({
	name: { type: String, required: true },
  code: { type: String, required: true, label: 'Código: (es_AR)' },
  strings: [{
    key: { type: String },
    text: { type: String }
  }],
	updated_at : { type: Date, editable: false },
	created: { type: Date, 'default' : (new Date()), editable: false }
});

schema.pre('save', function(next) {
  // Update updated
  this.updated_at = (new Date());

  if (!this.created) {
    this.created = new Date();
  }

  next();
});

var model = module.exports = mongoose.model(filename, schema);
model.formage = {
  label: 'Idioma',
  section: 'Idioma'
};