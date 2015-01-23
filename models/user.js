var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

/*
 Cuando el usuario cambia de ciudad se actualiza en su dipositivo mediante su ID.

 ----- V2 -----
 En la versión V2 sólo se consulta al usuario. El usuario debe tener toda su info personalizada.
 En cada request se deben guardar datos de cada endpoint del usuario.

 - Posibilidad de suscribirse a noticias
 - Posibilidad de suscribirse al clima
*/

var schema = mongoose.Schema({
	os: { type: String, required: true, enum: ['android', 'ios', 'web'] },
	udid : { type: String, required: true },
	pid : { type: String, required: false },
  city: { type: Types.ObjectId, ref: 'city', required: false },
  language: { type: Types.ObjectId, ref: 'language', required: false }, // El lenguaje tiene las strings a formatear
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

var model = module.exports = mongoose.model('user', schema);
model.formage = {
  label: 'Usuarios',
  section: 'Usuarios',
  filters: ['os', 'city'],
  list: ['os', 'city', 'udid'],
  list_populate: ['city']
};