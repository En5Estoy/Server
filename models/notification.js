var mongoose = require('mongoose'),
	Types = mongoose.Schema.Types;

var schema = mongoose.Schema({
	title: {
		type: String,
		required: true,
		label: 'Título'
	},
	text: {
		type: String,
		required: true,
		label: 'Texto'
	},
	url: {
		type: String,
		label: 'URL'
	},
	city: {
		type: Types.ObjectId,
		required: false,
		ref: 'city',
		label: 'Ciudad (No Requerida)'
	},
	notify: {
		type: Boolean,
		default: false,
		label: 'Notificar'
	},
	updated_at: {
		type: Date,
		label: 'Fecha de Actualización',
		editable: false
	},
	created: {
		type: Date,
		'default': (new Date()),
		editable: false
	}
});

schema.pre('save', function(next) {
	// Update updated
	this.updated_at = (new Date());

	next();
});

// Si viene ciudad sólo mandar a los usuarios de esa ciudad, sinó a todas.
schema.post('save', function(doc) {
	// Send push to all registereds
	var gcm = require('node-gcm');

	if (doc.notify) {
		mongoose.model('user').find({}, function(err, data) {
			var registration_ids = [];

			for (var i in data) {
				// chequear si el usuario es de la ciudad
				if (doc.city == undefined || data[i].city.toString() == doc.city.toString()) {
					registration_ids.push(data[i].pid);
				}
			}

			if (registration_ids.length > 0) {
				var message = new gcm.Message({
					collapseKey: 'notification',
					delayWhileIdle: true,
					timeToLive: 3,
					data: {
						title: doc.title,
						message: doc.text,
						url: doc.url
					}
				});

				var sender = new gcm.Sender(app.get('gcm_key'));

				sender.send(message, registration_ids, 4, function(err, result) {
					console.log(result);
				});
			}
		});
	}
});

var model = module.exports = mongoose.model('notification', schema);
model.formage = {
	label : 'Notificación',
	section: 'Noticias'
};