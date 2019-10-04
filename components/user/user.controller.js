'use strict'

var User = require('./user.model');
var tokens = require('../../services/token.service');
var errorHandler = require('../error/error_handler');

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
            else if (user.password != req.body.password) res.status(200).send({ ok: false, msg: 'Bad password' });
            else res.status(200).send({
                ok: true,
                msg: 'Correct password',
                log_in_token: tokens.getLogInToken(user),
                refresh_token: tokens.getRefreshToken(req, user)
            });
        });
    }
}

module.exports = {
    logIn,
}