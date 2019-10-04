'use strict'

var express = require('express');
var tokenService = require('./token.service');
var autenticationMiddleware = require('../middleware/autentication.middleware');

var api = express.Router();

api.get('/refresh_log_in_token', autenticationMiddleware.verifyRefreshToken, tokenService.updateLogInToken);

module.exports = api;