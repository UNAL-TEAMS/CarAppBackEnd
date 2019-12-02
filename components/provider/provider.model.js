'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var provider = Schema({
    email: String,
    name: String,
    password: String,
    NIT: Number,
    avatar: String,
    services: {
        Soat: String,
        RevTec: String,
        Rev5k: String,
    },
});

module.exports = mongoose.model('provider', provider);