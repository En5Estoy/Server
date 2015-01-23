// Handle application loading

var router,
	queue,
	map;

queue = new createjs.LoadQueue();
queue.on("complete", handle_complete, this);
queue.on("progress", handle_progress, this);
queue.setMaxConnections(10);
queue.loadManifest([{
	id: "css",
	src: "/stylesheets/style.css"
},{
	id: "alertify_core",
	src: "/stylesheets/alertify.core.css"
},{
	id: "alertify_default",
	src: "/stylesheets/alertify.default.css"
}, {
	id: "router",
	src: "/javascripts/grapnel.min.js"
}, {
	id: "alertify",
	src: "/javascripts/alertify.min.js"
}, {
	id: "pubsub",
	src: "/javascripts/pubsub.js"
}, {
	id: "move",
	src: "/javascripts/move.min.js"
}, {
	id: "maps",
	src: "/javascripts/leaflet.js"
}, {
	id: "maps_markers",
	src: "/javascripts/leaflet.markers.js"
}, {
	id: "request",
	src: "/javascripts/reqwest.min.js"
}, {
	id: "alertify",
	src: "/javascripts/alertify.min.js"
}, {
	id: "template",
	src: "/javascripts/ashe.js"
}, {
	id: "Q",
	src: "/javascripts/q.js"
}, {
	id: "urls",
	src: "/javascripts/urls.js"
}, {
	id: "logo",
	src: "/images/logo.png"
}, {
	id: "app_html",
	type: 'text',
	src: "/templates/app.html"
}, {
	id: "app_row_box",
	type: 'text',
	src: "/templates/row_box.html"
}, {
	src: '/stylesheets/roboto/RobotoSlab-Thin-webfont.eot'
}, {
	src: '/stylesheets/roboto/RobotoSlab-Thin-webfont.woff'
}, {
	src: '/stylesheets/roboto/RobotoSlab-Thin-webfont.ttf'
}, {
	src: '/stylesheets/roboto/RobotoSlab-Thin-webfont.svg'
}, {
	src: '/stylesheets/ionicons/ionicons.eot'
}, {
	src: '/stylesheets/ionicons/ionicons.woff'
}, {
	src: '/stylesheets/ionicons/ionicons.ttf'
}, {
	src: '/stylesheets/ionicons/ionicons.svg'
}, {
	src: '/stylesheets/mapicons/map-icons.eot'
}, {
	src: '/stylesheets/mapicons/map-icons.svg'
}, {
	src: '/stylesheets/mapicons/map-icons.ttf'
}, {
	src: '/stylesheets/mapicons/map-icons.woff'
}]);

function handle_progress(e) {
	//console.info((e.progress * 100).toFixed(0));

	document.getElementsByClassName('pace-progress')[0].innerText = (e.progress * 100).toFixed(0) + '%';
}

function handle_complete() {
	console.info('App loaded...');
	// Do whatever needed here
	router = new Grapnel.Router();

	prepare_routes();
	load_app();
}

function load_app() {
	// Remove loader
	document.getElementsByClassName('pace')[0].parentNode.removeChild(document.getElementsByClassName('pace')[0]);

	// Get app template
	var ahtml = Ashe.parse(queue.getResult("app_html"), {});

	document.getElementsByClassName('app')[0].innerHTML = ahtml;

	move('.e5e_sidebar')
		.to(400, 0)
		.duration('0s')
		.end();

	create_map();

	create_handlers();

	load_categories();
}

function create_map() {
	// Create MAP
	map = L.map('map', {
		center: [-31.41991, -64.18878],
		zoom: 13,
		zoomControl: false,
		attributionControl: false
	});

	L.tileLayer('http://129.206.74.245:8001/tms_r.ashx?x={x}&y={y}&z={z}', {}).addTo(map);
}

function load_categories() {
	var categories = document.getElementById("categories");

	reqwest({
		url: urls.commerce.categories,
		type: 'json',
		method: 'get',
		error: function(err) {
			console.error('Error: ' + err);
		},
		success: function(response) {
			if (response.categories.length > 0) {
				for( var i = 0 ; i < response.categories.length ; i++ ) {
					var category = response.categories[i];
					var option = document.createElement("option");
					option.text = category.name;
					option.value = category.id;
					categories.add(option);
				}
			} else {
			}
		}
	});
}

function create_handlers() {
	document.getElementsByClassName('close')[0].addEventListener('click', function(e) {
		move('.e5e_sidebar')
			.to(400, 0)
			.ease('in-out')
			.duration('0.5s')
			.set('opacity', 0)
			.end();

		e.stopPropagation();
		e.preventDefault();
	}, false);

	document.getElementsByClassName('search')[0].addEventListener('click', function(e) {
		var active = document.querySelectorAll('.tabs .active')[0].id;

		if (active == "tab_transport") {
			var fromField = document.getElementById('fromTxt');
			var toField = document.getElementById('toTxt');

			// checkeos

			if (fromField.value == '' && toField.value == '') {
				alertify.error('No pueden quedar ambos campos vacíos.');

				return;
			}

			document.getElementsByClassName('loader')[0].style.display = 'block';

			Q.all([calculate(fromField, toField)]).then(function() {
				document.getElementsByClassName('loader')[0].style.display = 'none';

				sidebar_title('Transporte');
				show_tabs();
				show_sidebar();
			});
		} else {
			load_commerces();
		}
	});

	document.getElementById('tab_commerce').addEventListener('click', function(e) {
		document.getElementById('form_commerce').style.display = 'block';
		document.getElementById('form_transport').style.display = 'none';

		document.getElementById('tab_commerce').classList.add('active');
		document.getElementById('tab_transport').classList.remove('active');
	});

	document.getElementById('tab_transport').addEventListener('click', function(e) {
		document.getElementById('form_commerce').style.display = 'none';
		document.getElementById('form_transport').style.display = 'block';

		document.getElementById('tab_commerce').classList.remove('active');
		document.getElementById('tab_transport').classList.add('active');
	});
}

function show_sidebar() {
	move('.e5e_sidebar')
		.to(0, 0)
		.ease('in-out')
		.duration('0.5s')
		.set('opacity', 1)
		.end();
}

function hide_tabs() {
	document.querySelectorAll('.e5e_sidebar .tabs')[0].style.display = 'none';
}

function show_tabs() {
	document.querySelectorAll('.e5e_sidebar .tabs')[0].style.display = 'block';
}

function sidebar_title( title ) {
	document.querySelectorAll('.e5e_sidebar .title')[0].innerText = title;
}

function load_commerces() {
	document.getElementsByClassName('loader')[0].style.display = 'block';

	navigator.geolocation.getCurrentPosition(function(loc) {
		var data = {
			lat: loc.coords.latitude,
			lon: loc.coords.longitude,
			search: document.getElementById("searchTxt").value,
			category: document.getElementById("categories").value
		};

		reqwest({
			url: urls.commerce.search,
			type: 'json',
			data: data,
			method: 'post',
			error: function(err) {
				document.getElementsByClassName('loader')[0].style.display = 'none';
				console.error('Error: ' + err);
			},
			success: function(response) {
				document.getElementsByClassName('loader')[0].style.display = 'none';

				var content = document.getElementsByClassName('content')[0];
				content.innerHTML = '';
				
				if( response.venues ) {
					var venues = response.venues;
					for (var i = 0; i < venues.length; i++) {
						var data = venues[i];

						var description = data.location.address + "<br/>" + data.categories[0].name;
						var row = Ashe.parse(queue.getResult('app_row_box'), {
							type: "commerce",
							name: data.name,
							description: description
						});
						var el = document.createElement('div');
						el.innerHTML = row;

						content.appendChild(el.firstChild);

						L.marker([data.location.lat, data.location.lng], {
							data: data,
							icon: L.AwesomeMarkers.icon({
								icon: 'commerce',
								markerColor: 'blue'
							})
						}).addTo(map);
					}

					sidebar_title('Comercios y Lugares');
					hide_tabs();
					show_sidebar();

					map.setZoomAround([loc.coords.latitude, loc.coords.longitude], 18, {animate: true});
				}
			}
		});
	});
}
function calculate(fromField, toField) {
	var md = Q.defer();
	var d = Q.defer();

	d.promise
		.then(function(obj) {
			var d = Q.defer();

			getLocation(fromField.value, function(data) {
				obj.lat = data.lat;
				obj.lon = data.lng;

				map.setZoomAround([obj.lat, obj.lon], 17, {animate: true});

				d.resolve(obj);
			});

			return d.promise;
		})
		.then(function(obj) {
			var d = Q.defer();

			getLocation(toField.value, function(data) {
				obj.to_lat = data.lat;
				obj.to_lon = data.lng;

				d.resolve(obj);
			});

			return d.promise;
		})
		.then(function(obj) {
			reqwest({
				url: urls.transport.transport,
				type: 'json',
				data: obj,
				method: 'post',
				error: function(err) {},
				success: function(response) {
					var content = document.getElementsByClassName('content')[0];
					content.innerHTML = '';

					for (var i = 0; i < response.length; i++) {
						var data = response[i];

						if( data.line ) {
							var description = "Subís a " + data.from.distance_string + ' mts  en ' + data.from.street.name + ' y debés bajar en ' + data.to.street.name + '. El destino está a ' + data.to.distance_string + ' mts.';
							var row = Ashe.parse(queue.getResult('app_row_box'), {
								type: data.line.transport.type,
								name: data.line.name + ' - ' + data.line.transport.name,
								description: description
							});
							var el = document.createElement('div');
							el.innerHTML = row;

							content.appendChild(el.firstChild);

							L.marker([data.from.location.lat, data.from.location.lon], {
								data: data,
								icon: L.AwesomeMarkers.icon({
									icon: 'bus',
									markerColor: 'red'
								})
							}).addTo(map);
						}
					}

					md.resolve();
				}
			});
		})
		.fail(function(obj) {
			alertify.error(obj.error);
		});

	d.resolve({});

	return md.promise;
}

function getLocation(location, callback) {
	if (location == '') {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(loc) {
				callback({
					lat: loc.coords.latitude, 
					lng: loc.coords.longitude
				});
			});
		}
	} else {
		if (location.indexOf(',') == -1) {
			location += ' , Córdoba, Argentina';
		}

		reqwest({
			url: urls.geocode + encodeURIComponent(location),
			type: 'json',
			method: 'get',
			error: function(err) {
				console.error('Error: ' + err);
			},
			success: function(response) {
				if (response.results.length > 0) {
					var coords = response.results[0].geometry.location;
					callback(coords);
				} else {
					callback(false);
				}
			}
		});	
	}
}

function prepare_routes() {
	router.get('products/:page?', function(req) {
		var page = req.params.page + '.html';
		// GET widgets.html
		$('body').load(page);
	});
}