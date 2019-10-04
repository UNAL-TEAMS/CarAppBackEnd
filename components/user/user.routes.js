'use strict'

var express = require('express');
var userController = require('./user.controller');

var api = express.Router();

api.post('/logIn', userController.logIn);

module.exports = api;