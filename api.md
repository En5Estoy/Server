FORMAT: 1A
HOST: http://www.en5estoy.com

# En 5 Estoy
Esta API describe todos los endpoints para acceder a los servicios de *En 5 Estoy*.

Descripción de la API V1

# Group Weather
Devuelve el Clima

## Weather [/v1/weather]
### Data Depending the User [POST]
+ Parameters
    + UDID
+ Response 200 (application/json)

        {
            "result": true,
            "data": [
                {
                    "url": "http://www.diaadia.com.ar/deportes/sabella-estuvo-casa",
                    "title": "Sabella estuvo en casa"
                }
            ]
        }


# Group News - Notifications
Devuelve las noticias

## News [/api/v1/news]
### Data Depending the User [POST]
+ Parameters
    + UDID
+ Response 200 (application/json)

        {
            "result": true,
            "data": [
                {
                    "url": "http://www.diaadia.com.ar/deportes/sabella-estuvo-casa",
                    "title": "Sabella estuvo en casa"
                }
            ]
        }

## Notifications [/api/v1/notifications]
### Data Depending the User [POST]
+ Parameters
    + UDID
+ Response 200 (application/json)

    {
        "result": true,
        "data": [
            {}
        ]
    }

# Group Cities
Devuelve las Ciudades Disponibles en el Sistema

## Cities [/v1/cities]
### Data [GET]
+ Response 200 (application/json)

    {
        "result": true,
        "data": [
            {
                "state": {
                    "name": "Cordoba",
                    "_id": "52cd51bc35ba9f0000a73c86"
                },
                "name": "Cordoba",
                "_id": "52cd51c335ba9f0000a73c8a",
                "features": []
            },
        ]
    }


# Group Commerces
Servicio de consulta de Comercios

## Categories [/v1/commerce/categories]
Responde desde el API de Foursquare
### Data [GET]
+ Response 200 (application/json)

    [
        {...}
    ]

## Search [/api/v1/commerce/search]
### Data [POST]
+ Parameters
    + search
    + category (optional)
    + lat
    + lon
+ Response 200 (application/json)

    [
        {...}
    ]

## Recommendations [/api/v1/commerce/recommendations]
Recomendaciones de Comercios basadas en el usuario actual
### Data [POST]
+ Parameters
    + UDID
+ Response 200 (application/json)

    [
        {...}
    ]

# Group Red Bus
Sección especial para Red Bus con actualización de API y mejora de Velocidad.

## Session [/v1/redbus/session]
Crea y Devuelve la sesión para iniciar la consulta.
### Data [GET]
+ Response 200 (application/json)

    {
        "result": true,
        "cookie": "phj2arkf7855vrmloruj8vjhr3"
    }

## Captcha [/v1/redbus/captcha/{session}]
Obtiene el Captcha basado en la sesión creada
### Data [GET]
+ Parameters
    + session
+ Response 200 (image/jpeg)


## Send [/api/v1/redbus/send]
Obtiene el saldo de la tarjeta
### Data [POST]
+ Parameters
    + dni
    + card
    + captcha
    + cookie ... ID de Sesión
+ Response 200 (application/json)

    {
        ...
    }


# Group Taxi
Devuelve el valor del viaje en Taxi dependiendo la ciudad del usuario. Calcula múltiples tarifas si es necesario.

## Taxi [/api/v1/taxi]
Obtiene el valor del viaje y si es necesario los múltiples valores por segmentación.
### Data [POST]
+ Parameters
    + UDID
    + address_from (optional)
    + address_to (optional)
    + gps_from (optional)
    + gps_to (optional)
+ Response 200 (application/json)

    [
        {...}
    ]


# Group User
Crea o actualiza los usuarios en el sistema. Los usuarios son parte fundamental del servicio ya que con ellos se manejan los diferentes endpoints y las características disponibles

## User [/api/v1/user/register]
Registra o Acualiza un usuario
### Data [POST]
+ Parameters
    + city (string) ... Palabra Clave que referencie a la Ciudad
    + os ... Sistema Operativo
    + UDID ... ID Único de Dispotivo
    + pid ... Push ID
+ Response 200 (application/json)

    {
        "result" : true,
        city: {
            "_id": "52dffdd96bd35ec13c9a67b6",
            "name": "Montevideo",
            "state": {
                "name": "Montevideo",
                "_id": "52dffdb16bd35ec13c9a67b0"
            },
            "features": [
                "transport",
                "taxi",
                "commerce",
                "notifications",
                "weather"
            ]
        }
    }
