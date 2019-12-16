'use strict'

var multer = require('multer');
var express = require('express');
var providerController = require('./provider.controller');
var logInMiddleware = require('../../middleware/autentication.middleware').tokenProviderlogInVerify;
var type = multer().single('file');
var api = express.Router();

api.post('/log_in', providerController.logIn);
api.put('/create_provider', providerController.createProvider);
api.get('/own_provider', logInMiddleware, providerController.getOwnProvider);
api.post('/modify_provider', logInMiddleware, providerController.modifyProvider);
api.get('/provider_photo/:file_name', providerController.getProviderImg);
api.post('/upload_avatar', logInMiddleware, type, providerController.uploadProviderImg);
<<<<<<< HEAD
api.get('/get_specific_provider/:service', providerController.getSpecificProvider);
=======
api.get('/get_specific_provider', providerController.getSpecificProvider);
>>>>>>> b15fe52b9b140c9f9a55837078f9136f04ba3e3f


module.exports = api;