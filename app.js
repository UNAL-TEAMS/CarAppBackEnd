'use strict'

var app = require('express')();
var bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// configurar cabeceras http

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); //GLOBALS.WEB_PAGE_URL);
    res.header('Access-Control-Allow-Headers', '*'); //'Authorization, authorizationprovider, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method')
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Request-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

    next();
});

// cargar rutas

var userRoutes = require('./components/user/user.routes');
var serviceRoutes = require('./services/services.routes');
var deviceRoutes = require('./components/device/device.routes');

// rutas base

app.get('/', (req, res) => res.status(200).send('CarApp backend'));

app.use('/user', userRoutes);
app.use('/service', serviceRoutes);
app.use('/device', deviceRoutes);

module.exports = app;