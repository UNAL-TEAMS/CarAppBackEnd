'use strict'

var express = require('express');
var userController = require('./user.controller');
var logInMiddleware = require('../../middleware/autentication.middleware').tokenlogInVerify;
var api = express.Router();


module.exports = api;