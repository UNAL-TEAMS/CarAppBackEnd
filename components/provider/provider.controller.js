'use strict'

var Provider = require('./provider.model');
var tokens = require('../../services/token.service');
var errorHandler = require('../error/error_handler');
var moment = require('moment');
var imageHash = require('node-image-hash');
var crypto = require('crypto');
var fs = require('fs');
var USER_TYPES = require('../../services/token.service').USER_TYPES;


const SERVICE_TYPE = {
    Kilometer: '5K',
    SOAT: 'SOAT',
    TecnoMecanica: 'TecnoMecanica',
};

/**
 * 
 * @param {String} req.body.email - Email del proveedor que hace logIn (Obligatorio)
 * @param {String} req.body.password - Contraseña del proveedor que hace logIn (Obligatorio) 
 */
function logIn(req, res) {
    if (!req.body.email) res.status(400).send('Missing email');
    else if (!req.body.password) res.status(400).send('Missing password');
    else {
        Provider.findOne({ email: req.body.email }, (err, provider) => {
            if (err) errorHandler.mongoError(err, res, 'Error searching provider in db');
            else if (!provider) res.status(404).send('Provider no found');
            else if (provider.password != cryptPassword(req.body.password)) res.status(400).send('Bad password');
            else res.status(200).send({
                msg: 'Correct password',
                log_in_token: tokens.getLogInProviderToken(provider._id),
                refresh_token: tokens.getRefreshToken(req, provider._id, USER_TYPES.PROVIDER),
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
 * @param {String} req.body.email - El correo del proveedor a crear (OBLIGATORIO)
 * @param {String} req.body.name - El name del proveedor a crear (OBLIGATORIO)
 * @param {String} req.body.password - La contraseña del proveedor a crear (OBLIGATORIO)
 * @param {Number} req.body.NIT -Nit del proveedor a crear (OBLIGATORIO)
 * @param {Number} req.body.phone -phone del proveedor a crear (OBLIGATORIO)
 * @param {Any} req.body.service -Servicios que ofrece el proveedor (OBLIGATORIO)
 * */
function createProvider(req, res) {
    if (!req.body.email) res.status(400).send('The email is obligatory');
    else if (!req.body.name) res.status(400).send('The name is obligatory');
    else if (!req.body.password) res.status(400).send('The password is obligatory');
    else if (!req.body.NIT) res.status(400).send('The NIT is obligatory');
    else if (!req.body.phone) res.status(400).send('The phone is obligatory');
    else if (!req.body.services) res.status(400).send('The services is obligatory');
    //Verificando que el usuario sea único
    else Provider.find({ 'email': req.body.email }, (err, docs) => {
        if (err) res.status(500).send('Error verifying email');
        else if (docs.length > 0) res.status(400).send('Not unique email');
        else {
            // El email es único, y se han enviado todos los datos necesarios
            var newProvider = new Provider();
            newProvider.email = req.body.email;
            newProvider.name = req.body.name;
            //console.log(cryptPassword(req.body.password));
            newProvider.password = cryptPassword(req.body.password);
            newProvider.phone = req.body.phone;
            newProvider.NIT = req.body.NIT;
            newProvider.services = req.body.services;
            // Guardar Usuario
            newProvider.save((err, providerStored) => {
                if (err) res.status(500).send('Error saving provider');
                else if (!providerStored) res.status(500).send('Error saving provider. Provider not stored');
                else res.status(201).send('Provider Saved');
            });
        }
    });
}


/**
 * @author German Guerrrero
 * @description Permite obtener el proveedor que mando el token
 * @param {String} req.headers.authorization- El token del proveedor logeado (OBLIGATORIO)
 * */
function getOwnProvider(req, res) {
    res.status(200).send(req.token_provider);
}


/**
 * @author German Guerrrero
 * @description Permite obtener el proveedores segun el servicio
 * @param {String} req.params.service- El servicio del proveedor (OBLIGATORIO)
 * */
function getSpecificProvider(req, res) {
    if (!req.params.service) return res.status(400).send('The service is obligatory');
    var request;
    switch (req.params.service) {
        case SERVICE_TYPE.SOAT:
            request = { 'services.Soat.has': true };
            break;
        case SERVICE_TYPE.Kilometer:
            request = { 'services.RevTec.has': true };
            break;
        case SERVICE_TYPE.TecnoMecanica:
            request = { 'services.Rev5k.has': true };
            break;
        default:
            return res.status(400).send('Invalid service');
    }
    Provider.find(request, (err, providers) => {
        if (err) return res.status(500).send('Error searching providers');
        res.status(200).send(providers);
    });
}


/**
 * @author Ivan Quiroga
 * @description Permite modificar el usuario actual
 * @param {String} req.headers.authorization- El token del usuario logeado (OBLIGATORIO)
 * @param {String} req.body.name - El name del usuario a modificar
 * @param {String} req.body.password - La contraseña nueva del usuario
 * @param {Number} req.body.NIT - Numero de identificacion del usuario a crear
 * */
function modifyProvider(req, res) {
    if (req.body.name) req.token_provider.name = req.body.name;
    if (req.body.password) req.token_provider.password = req.body.password;
    if (req.body.NIT) req.token_provider.NIT = req.body.NIT;
    if (req.body.services) req.token_provider.services = req.body.services;
    req.token_provider.save((err, savedProvider) => {
        if (err) res.status(500).send('Error searching user');
        else if (!savedProvider) res.status(404).send('User not found');
        else res.status(201).send({ new_Provider: savedProvider, info: 'Success' });
    })
}


/**
 * @author German Guerrero
 * @description Permite subir una imagen como foto de perfil de un provider
 * @param {String} req.headers.authorization- El token del provider logeado (OBLIGATORIO)
 * @param {File} req.file - Archivo con la imagen de perfil (OBLIGATORIO)
 * */
function uploadProviderImg(req, res) {
    if (!req.file) res.status(400).send('The file is obligatory');
    else imageHash.hash(req.file.buffer, 8).then((hash) => { // Hash file for name
        var fileName = "" + req.file.originalname;
        // FileName is hash plus time plus original file extension
        fileName = hash.hash + moment.now() + '.' + fileName.split('.').pop();
        Provider.findOneAndUpdate({ _id: req.token_provider._id }, { avatar: fileName }, (err, providerUpdated) => {
            if (err) res.status(500).send('Error updating profile image', err);
            else if (!providerUpdated) res.status(404).send('User not found');
            else {
                if (providerUpdated.avatar && fs.existsSync('./uploads/providerPhotos/' + providerUpdated.avatar)) fs.unlinkSync('./uploads/userPhotos/' + userUpdated.avatar);
                fs.writeFileSync('./uploads/providerPhotos/' + fileName, req.file.buffer);
                res.status(200).send({ name_image: fileName, info: 'Image Updated' });
            }
        });
    });
}
/**
 * @author German Guerrero
 * @description Envia la foto del provider con el nombre especificado
 * @param {String} req.params.file_name -  nombre de la imagen
 */

function getProviderImg(req, res) {
    if (!req.params.file_name) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The file_name is obligatory');
    else res.sendFile(path.resolve('./uploads/providerPhotos/' + req.params.file_name), {}, (err) => {
        if (err) res.status(404).send('File no Found');
    });
}

module.exports = {
    logIn,
    createProvider,
    getOwnProvider,
    modifyProvider,
    uploadProviderImg,
    getProviderImg,
    getSpecificProvider
}