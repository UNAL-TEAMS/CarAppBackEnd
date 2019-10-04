'use strict'

var multer = require('multer');
var express = require('express');
var userController = require('./user.controller');
var type = multer().single('file');
var api = express.Router();

api.post('/add_car', userController.addCar);
api.post('/logIn', userController.logIn);
api.post('/upload_car_image', type,userController.uploadCarImg);
api.post('/del_car', userController.removeCar);

api.put('/create_user', userController.createUser);


module.exports = api;