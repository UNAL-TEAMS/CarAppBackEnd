'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var user = Schema({
    email: String,
    password: String,
});

module.exports = mongoose.model('user', user);