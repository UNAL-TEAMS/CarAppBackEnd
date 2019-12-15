'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var service = Schema({
    has: Boolean,
    description: String,
});

var provider = Schema({
    email: String,
    phone: Number,
    name: String,
    password: String,
    NIT: Number,
    avatar: String,
    services: {
        Soat: service,
        RevTec: service,
        Rev5k: service,
    },
});

module.exports = mongoose.model('provider', provider);