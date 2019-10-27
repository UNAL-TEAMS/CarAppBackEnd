'use strict'

require('dotenv').config(); //For heroku 

var mongoose = require('mongoose');
var port = process.env.PORT || 12345;
var app = require('./app');

mongoose.connect('mongodb://localhost:27017/CarApp', { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.log('cant connect to database. Error: ');
        console.log(err);
    } else {
        console.log('Conexión exitosa con la base de datos');
        app.listen(port, "0.0.0.0", () => {
            console.log('Servidor escuchando en http://localhost:' + port);
        });
    }
});