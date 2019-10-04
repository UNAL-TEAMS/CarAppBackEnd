'use strict'

var User = require('./user.model');
var tokens = require('../../services/token.service');
var errorHandler = require('../error/error_handler');
var moment = require('moment');
var imageHash = require('node-image-hash');
var crypto = require('crypto');
var fs = require('fs');

/**
 * 
 * @param {String} req.body.email - Email del usuario que hace logIn (Obligatorio)
 * @param {String} req.body.password - Contraseña del usuario que hace logIn (Obligatorio) 
 */
function logIn(req, res) {
    if (!req.body.email) res.status(400).send('Missing email');
    else if (!req.body.password) res.status(400).send('Missing password');
    else {
        User.findOne({ email: req.body.email }, (err, user) => {
            if (err) errorHandler.mongoError(err, res, 'Error searching user in db');
            else if (!user) res.status(404).send('User no found');
            else if (user.password != req.body.password) res.status(400).send('Bad password');
            else res.status(200).send({
                msg: 'Correct password',
                log_in_token: tokens.getLogInToken(user),
                refresh_token: tokens.getRefreshToken(req, user)
            });
        });
    }
}

function cryptPassword(password) {
    return crypto.createHash('sha256').update(password).digest('base64');
}

/**
 * @author Ivan Quiroga
 * @description Crea un nuevo usuario
 * @param {String} req.body.email - El correo del usuario a crear (OBLIGATORIO)
 * @param {String} req.body.name - El name del usuario a crear (OBLIGATORIO)
 * @param {String} req.body.password - La contraseña del usuario a crear (OBLIGATORIO)
 * @param {Date} req.body.identification - Numero de identificacion del usuario a crear (OBLIGATORIO)
 * */
function createUser(req, res) {
    var diff;
    if (!req.body.email)  res.status(400).send('The email is obligatory');
    else if (!req.body.name) res.status(400).send('The name is obligatory');
    else if (!req.body.password) res.status(400).send('The password is obligatory');
    else if (!req.body.identification) res.status(400).send('The birthdate is obligatory');
    //Verificando que el usuario sea único
    else User.find({'email': req.body.email }, (err, docs) => {
        if (err) res.status(500).send('Error verifying email');
        else if (docs.length > 0) res.status(400).send('Not unique email');
        else {
            // El email es único, y se han enviado todos los datos necesarios
            var newUser = new User();
            newUser.email = req.body.email;
            newUser.name = req.body.name;
            //console.log(cryptPassword(req.body.password));
            newUser.password = cryptPassword(req.body.password);    
            newUser.identification = req.body.identification;
            // Guardar Usuario
            newUser.save((err, userStored) => {
                if (err)  res.status(500).send('Error saving user');
                else if (!userStored) res.status(500).send('Error saving user. User not stored');
                else  res.status(201).send('User Saved');
            });
        }
    });
}

/**
 * @author Ivan Quiroga
 * @description Agrega un carro a un usuario
 * @param {String} req.headers.authorization- El token del usuario logeado (OBLIGATORIO)
 * @param {String} req.body.branch - El correo del usuario a crear (OBLIGATORIO)
 * @param {Number} req.body.model - El correo del usuario a crear (OBLIGATORIO)
 * @param {String} req.body.reference - El correo del usuario a crear (OBLIGATORIO)
 * @param {Date} req.body.lastSoatDate - El name del usuario a crear (OBLIGATORIO)
 * @param {Date} req.body.lastTecDate - La contraseña del usuario a crear (OBLIGATORIO)
 * @param {String} req.body.license_plate - Fecha de nacimiento del usuario a crear (OBLIGATORIO)
 * @param {Number} req.body.current_kilometer - Fecha de nacimiento del usuario a crear (OBLIGATORIO)
 * */
function addCar(req, res) {

    if (!req.body.branch) res.status(400).send('The branch is obligatory');
    else if (!req.body.model) res.status(400).send('The model is obligatory');
    else if (!req.body.reference) res.status(400).send('The reference is obligatory');
    else if (!req.body.lastSoatDate) res.status(400).send('The lastSoatDate is obligatory');
    else if (!req.body.lastTecDate) res.status(400).send('The lastTecDate is obligatory');
    else if (!req.body.license_plate) res.status(400).send('The license_plate is obligatory');
    else if (!req.body.current_kilometer) res.status(400).send('The current_kilometer is obligatory');
    else {
        var newCar = {};
        newCar.branch = req.body.branch;
        newCar.model = req.body.model;
        newCar.reference = req.body.reference;
        newCar.lastSoatDate = req.body.lastSoatDate;
        newCar.lastTecDate = req.body.lastTecDate;
        newCar.license_plate = req.body.license_plate;
        newCar.current_kilometer = req.body.current_kilometer;

        User.findByIdAndUpdatee(req.token_user._id, { $push: { cars: newCar } }, { new: true }, (err, userUpdated) => {
            if (err) res.status(500).send('Error adding car');
            else if (!userUpdated) res.status(404).send('Error adding bike. bike not added or user not found');
            else res.status(201).send({info: userUpdated.cars[userUpdated.cars.length-1]._id,msg:'Success'});
        });
    }
}

/**
 * @author Ivan Quiroga
 * @description Permite eliminar una carro del usuario. Tambien borra la imagen asociada a el
 * @param {String} req.headers.authorization- El token del usuario logeado (OBLIGATORIO)
 * @param {String} req.body.car_id - id del carro a eliminar (OBLIGATORIO)
 */
function removeCar(req, res) {
    if (!req.body.car_id) res.status(400).send('The car_id is obligatory');
    else User.findByIdAndUpdate(req.token_user._id, { $pull: { cars: { _id: req.body.car_id } } }, (err, user) => {
        if (err) res.status(500).send('Error searching user');
        else if (!user) res.status(404).send('User not found');
        else {
            var removedCar = user.cars.find(car => car._id == req.body.car_id);
            if (removedCar.picture && fs.existsSync('./uploads/carPhotos/' + removedCar.picture)) fs.unlinkSync('./uploads/carPhotos/' + removedCar.picture);
            res.status(201).send({removed_car: removedCar, info: 'Success'});
        }
    });
}


/**
 * @author Ivan Quiroga
 * @description Permite subir una imagen como foto de un carro de un usuario
 * @param {String} req.headers.authorization- El token del usuario logeado (OBLIGATORIO)
 * @param {String} req.body.car_id - id del carro (OBLIGATORIO)
 * @param {File} req.file - Archivo con la imagen de perfil (OBLIGATORIO)
 * */
function uploadCarImg(req, res) {
    if (!req.body.car_id) res.status(400).send('The car_id is obligatory');
    else if (!req.file) res.status(400).send('The file is obligatory');
    else imageHash.hash(req.file.buffer, 8).then((hash) => { // Hash file for name

        var fileName = "" + req.file.originalname;
        // FileName is hash plus time plus original file extension
        fileName = hash.hash + moment.now() + '.' + fileName.split('.').pop();

        User.findOneAndUpdate({ _id: req.token_user._id, 'cars._id': req.body.car_id }, { $set: { 'cars.$.picture': fileName } }, (err, userUpdated) => {

            if (err) res.status(500).send('Error updating car image', err);
            else if (!userUpdated) res.status(404).send('User or car not found');
            else {
                var updatedCar = userUpdated.cars.find(car => car._id == req.body.car_id);
                if (updatedCar.picture && fs.existsSync('./uploads/carPhotos/' + updatedCar.picture)) fs.unlinkSync('./uploads/carPhotos/' + updatedCar.picture);
                fs.writeFileSync('./uploads/carPhotos/' + fileName, req.file.buffer);
                res.status(201).send('Image Updated');
            }
        });
    });
}
module.exports = {
    logIn,
    createUser,
    addCar,
    uploadCarImg,
    removeCar,
}