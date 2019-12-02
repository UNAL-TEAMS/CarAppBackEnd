'use strict'

var express = require('express');
var deviceController = require('./device.controller');
var api = express.Router();

api.get('/test', deviceController.test);
api.get('/km/:plate/:value', deviceController.km);

module.exports = api;