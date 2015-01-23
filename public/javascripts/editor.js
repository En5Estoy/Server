var map,
  routeLayer,
  CustomRouteLayer;

S.extendPrototype();

// Suscription Tokens

var UPDATE_TOKEN = 'update_finished';

// Define Locations Array
var locations = [];

var ordereds = [];
var initial = [];

var listItem = '<div class="list-group-item">Parada {position} - <a class="remove-position" href="#" data-position="{position}">Eliminar</a></div>';

var routeType = 'shortest';

// Create MAP
map = L.map('map', {
  center: [-31.41991, -64.18878],
  zoom: 13
});

L.tileLayer('http://{s}.maptile.lbs.ovi.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?token={devID}&app_id={appID}', {
  subdomains: '1234',
  devID: 'xyz',
  appID: 'abc'
}).addTo(map);

// Join Events
map.on('contextmenu', function(e) {
  addLocation(e.latlng);
});

// Create icon
L.NumberedDivIcon = L.Icon.extend({
  options: {
    iconUrl: 'http://www.charliecroom.com/marker_hole.png',
    number: '',
    shadowUrl: null,
    iconSize: new L.Point(25, 41),
    iconAnchor: new L.Point(13, 41),
    popupAnchor: new L.Point(0, -33),
    className: 'leaflet-div-icon'
  },
 
  createIcon: function () {
    var div = document.createElement('div');
    var img = this._createImg(this.options['iconUrl']);
    var numdiv = document.createElement('div');
    numdiv.setAttribute ( "class", "number" );
    numdiv.innerHTML = this.options['number'] || '';
    div.appendChild ( img );
    div.appendChild ( numdiv );
    this._setIconStyles(div, 'icon');
    return div;
  },
 
  //you could change this to add a shadow like in the normal marker if you really wanted
  createShadow: function () {
    return null;
  }
});

function updateLocations(locs) {
  if (locs != undefined) {
    console.info(locs);
    // Updatte the locations
    for (var i = 0; i < locs.length; i++) {
      locations[i] = locs[i].latLng;
    }
  }
}

function addLocation(latlng) {
  locations.push(latlng);

  update();
}

function update() {
  if (routeLayer != undefined) {
    map.removeLayer(routeLayer);
  }
  routeLayer = new L.LayerGroup();

  for (var i = 0; i < locations.length; i++) {
    routeLayer.addLayer(L.marker(locations[i], {
      draggable: true,
      icon: new L.NumberedDivIcon({
        number: (i + 1)
      }),
      position: i
    }));
  }

  routeLayer.addTo(map);

  updateList();

  PubSub.publish(UPDATE_TOKEN, {});
}

function updateList() {
  $("#locations").empty();
  for (var i = 0; i < locations.length; i++) {
    $("#locations").append(listItem.replaceAll('{position}', (i + 1)));
  }
}

function getLetterIdentifier(position) {
  return String.fromCharCode('a'.charCodeAt(0) + position).toUpperCase();
}

function euclideanDistance(a, b) {
  var sum = 0;
  var n;
  for (n=0; n < a.length; n++) {
    sum += Math.pow(a[n]-b[n], 2);
  }
  return Math.sqrt(sum);
}

// Handlers

$(document).on('click', '#order_stops', function(e) {
  // Put click to each point. When click put the points in a ordered array.
  // Create an overlapping layer
  // ---------------------------------------------------------------------------------------------------------
  // Busqueda automatica definiendo los 3 primeros los agregar al array final y los saca del inicial
  // Busca el mas cercano en el array inicial y cuando lo encuentra lo pasa al array final.
  // Va mostrando los resultados
  
  if( $(this).text() == 'Terminar' ) {
    _.each(routeLayer.getLayers(), function(layer) {
      layer.off('click');
    });

    $(this).html('Ordernar Auto');
  } else {
    ordereds = [];
    
    PubSub.subscribe( UPDATE_TOKEN, function() {
      if( ordereds.length < 4 ) return;

      if( locations.length <= 1 ) {
        $('#order_stops').html('Ordernar Auto');

        PubSub.unsubscribe( UPDATE_TOKEN );

        ordereds.push(_.first(locations));
        locations = ordereds;

        ordereds = [];

        update();

        alertify.success('Búsqueda terminanda');

        return;
      }

      if (ordereds.length > 0) {
        var last = _.last(ordereds);
        var found = _.first(_.sortBy(locations, function(obj) {
          return euclideanDistance([last.lat, last.lng], [obj.lat, obj.lng])
        }));
        console.info(found);
        var iof = _.indexOf(locations, found);

        ordereds.push(found);
        locations.splice(iof, 1);

        update();
      }
    });

    alertify.success('Conectando nuevamente');
    connectManualClick();

    $(this).html('Terminar');
  }

  return false;
});

$(document).on('click', '#order_man_stops', function(e) {
  // Put click to each point. When click put the points in a ordered array.
  // Create an overlapping layer
  // ---------------------------------------------------------------------------------------------------------
  // Busqueda automatica definiendo los 3 primeros los agregar al array final y los saca del inicial
  // Busca el mas cercano en el array inicial y cuando lo encuentra lo pasa al array final.
  // Va mostrando los resultados
  
  if( $(this).text() == 'Terminar' ) {
    locations = ordereds;
    
    update();

    _.each(routeLayer.getLayers(), function(layer) {
      layer.off('click');
    });

    $(this).html('Ordernar Manual');
  } else {
    ordereds = [];
    //initial = _.clone(locations);
    connectManualClick();

    $(this).html('Terminar');
  }

  return false;
});

var connectManualClick = function() {
  _.each(routeLayer.getLayers(), function(layer) {
    layer.on('click', function(e) {
      manualClick(e);
    });
  });
};

var manualClick = function(e) {
  console.info(e);

  alertify.success('Cambiando posición');

  ordereds.push(e.latlng);
  locations.splice((e.target.options.position), 1);

  update();

  connectManualClick();
};


$(document).on('click', ".remove-position", function(e) {
  alertify.confirm("Seguro que desea borrarlo?", function(r) {
    if (r) {
      locations.splice((parseInt($(this).attr('data-position')) - 1), 1);

      update();
    }
  });

  return false;
});

$(document).on('change', '#transport', function(e) {
  if ($(this).val() != '') {
    $.get('/app/routes/editor/lines/' + $(this).val(), function(data) {
      if (data) {
        $("#lines").empty();
        $("#lines").append($('<option />').text('Seleccione...').val(''));
        for (var i = 0; i < data.data.length; i++) {
          $("#lines").append($('<option />').text(data.data[i].name).val(data.data[i]._id));
        }
      }
    }, 'json');
  }
  return false;
});

$(document).on('change', '#way', function(e) {
  e.stopPropagation();
  e.preventDefault();

  if( $(this).val() == 'no_way' ) {
    routeType = 'pedestrian';
  } else {
    routeType = 'shortest';
  }

  console.info(routeType);

  return false;
});

$(document).on('click', '#load_way', function(e) {
  e.stopPropagation();
  e.preventDefault();

  var line = $("#lines").val();
  var way = $("#way").val();

  if (line == '' || way == '') {
    alertify.error('Debe seleccionar una linea y un sentido.');

    return;
  }

  $.get('/app/routes/editor/stops/' + line + '/' + way, function(data) {
    console.info(data);

    if( data && data.data ) {
      locations = [];

      for (var i = 0; i < data.data.length; i++) {
        locations.push( {
          _id: data.data[i]._id,
          lat: data.data[i].location[1],
          lng: data.data[i].location[0]
        });
      }

      console.info(locations);

      update();
    }
  }, 'json');

  return false;
});

$(document).on('click', '#save_stops', function(e) {
  e.stopPropagation();
  e.preventDefault();

  alertify.confirm("El proceso de guardado se demorará varios segundos y hasta minutos dependiendo de la cantidad de puntos. Esta seguro que desea continuar?", function(r) {
    if (r) {
      var line = $("#lines").val();
      var way = $("#way").val();

      if (line == '' || way == '') {
        alertify.error('Debe seleccionar una linea y un sentido.');

        return;
      }

      var ld = [];
      var defers = [];

      // Get the info of every point before send the info
      _.each(locations, function(location, i) {
        var d = $.Deferred();

        $.get('/app/routes/editor/geocode/' + location.lat + '/' + location.lng, function(data) {
          var addr = data;

          var strt = addr.addressLine;
          if( strt == undefined ) strt = 'Sin Nombre';

          ld.push({
            line: line,
            type: way,
            order: i,
            street: {
              name: strt,
              number: 0
            },
            location: [location.lng, location.lat],
            enabled: true
          });

          d.resolve();
        }, "json");

        defers.push(d);
      });

      $.when.apply(this, defers).done(function() {
        // Ready

        console.info(ld);

        $.post('/app/routes/editor/stops', {
          line: line,
          type: way,
          locations: ld
        }, function(data) {
          if( data.result ) {
            alertify.success('Guardado correcto.');
          } else {
            alertify.error('Se produjo un error. Por favor chequee.');
          }
        }, 'json');
      });
    }
  });

  return false;
})