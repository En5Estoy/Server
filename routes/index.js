
/**
 * Import exported routes
 * 
 * @type Object Express App
 */
module.exports = {
	init: function(app) {
		var path = require('path'),
			fs = require('fs'),
			files = fs.readdirSync(__dirname);

		console.info(' ================ Routes ================ ');
		files.forEach(function(file) {
			var name = path.basename(file, '.js');
			if (name === 'index')
				return;

			if(name === '.DS_Store')
				return;

			require('./' + name).init(app);
			console.info(' + Router ' + name + ' started.');
		});
		console.info(' ======================================== ');
	}
};