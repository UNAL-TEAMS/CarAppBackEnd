'use strict'

var express = require('express');
var userController = require('./user.controller');

var api = express.Router();

api.post('/add_car', userController.addCar);
api.post('/logIn', userController.logIn);
api.put('/create_user', userController.createUser);

module.exports = api;