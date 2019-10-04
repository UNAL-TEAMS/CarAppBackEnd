'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var user = Schema({
    email: String,
    name: String,
    password: String,
    identification: Number,
    avatar: String,
    cars: [{
        branch: String,
        model: Number,
        lastSoatDate: Date,
        lastTecDate: Date, // male, female
        reference: String,
        license_plate: String,
        picture: String,    
        currentKilometer: Number,    
    }],
});

module.exports = mongoose.model('user', user);