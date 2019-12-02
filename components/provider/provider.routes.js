'use strict'

var multer = require('multer');
var express = require('express');
var providerController = require('./provider.controller');
var logInMiddleware = require('../../middleware/autentication.middleware').tokenlogInVerify;
var type = multer().single('file');
var api = express.Router();

api.post('/log_in', userController.logIn);
api.put('/create_provider', userController.createUser);
api.get('/own_provider', logInMiddleware, userController.getOwnUser);
api.post('/modify_provider', logInMiddleware, userController.modifyUser);
module.exports = api;