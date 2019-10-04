'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var user = Schema({
    email: String,
    cryptedPass: String,
});

module.exports = mongoose.model('user', user);