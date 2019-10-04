'use strict'

var express = require('express');
var userController = require('./user.controller');

var api = express.Router();

api.post('/log_in', userController.logIn);

module.exports = api;