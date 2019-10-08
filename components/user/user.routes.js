'use strict'

var multer = require('multer');
var express = require('express');
var userController = require('./user.controller');
var logInMiddleware = require('../../middleware/autentication.middleware').tokenlogInVerify;
var type = multer().single('file');
var api = express.Router();

api.post('/log_in', userController.logIn);
api.post('/add_car', logInMiddleware, userController.addCar);
api.post('/upload_car_image', logInMiddleware, type, userController.uploadCarImg);
api.post('/del_car', logInMiddleware, userController.removeCar);
api.put('/create_user', userController.createUser);
api.get('/own_user', logInMiddleware, userController.getOwnUser);

module.exports = api;