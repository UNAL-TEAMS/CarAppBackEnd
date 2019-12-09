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
        trade_mark: String,
        model: Number,
        lastSoatDate: Date,
        lastTecDate: Date,
        last5krev: Number,
        reference: String,
        license_plate: String,
        picture: String,
        currentKilometer: {
            type: Number,
            default: 0,
        },

    }],
});

module.exports = mongoose.model('user', user);