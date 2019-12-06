'use strict'

var token_service = require('../services/token.service');
var moment = require('moment');
var User = require('../components/user/user.model');
var Provider = require('../components/provider/provider.model');
var errorHandler = require('../components/error/error_handler');

function generalverify(req, res, callback) {
    if (!req.headers.authorization) res.status(400).send('Need a Token');
    else {
        var token_str = req.headers.authorization.replace(/['"]+/g, '');
        var token = token_service.decodeToken(token_str);
        if (token == null) res.status(400).send('Invalid token');
        else callback(token);
    }
}

function tokenlogInVerify(req, res, next) {
    generalverify(req, res, (token) => {
        if (token.user_type != token_service.USER_TYPES.USER) res.status(400).send('Not a user token');
        else if (token.type != token_service.TOKEN_TYPES.LOG_IN) res.status(400).send('Not a logIn token');
        // else if (moment().isAfter(token.dead_time)) res.status(400).send('Death token');
        else User.findById(token.user_id, (err, user) => {
            if (err) errorHandler.mongoError(err, res, 'Error on logIn');
            else {
                req.token_user = user;
                next();
            }
        });
    });
}

function verifyRefreshToken(req, res, next) {
    generalverify(req, res, (token) => {
        if (token.type != token_service.TOKEN_TYPES.REFRESH) res.status(400).send('Not a REFRESH token');
        else if (req.connection.remoteAddress != token.ip) res.status(400).send('Bad IP from token');
        else {
            req._id = token.user_id;
            req._user_type = token.user_type;
            next();
        }
    });
}

function tokenProviderlogInVerify(req, res, next) {
    generalverify(req, res, (token) => {
        if (token.user_type != token_service.USER_TYPES.PROVIDER) res.status(400).send('Not a provider token');
        else if (token.type != token_service.TOKEN_TYPES.LOG_IN) res.status(400).send('Not a logIn token');
        else if (moment().isAfter(token.dead_time)) res.status(400).send('Death token');
        else Provider.findById(token.user_id, (err, provider) => {
            if (err) errorHandler.mongoError(err, res, 'Error on logIn');
            else {
                req.token_provider = provider;
                next();
            }
        });
    });
}

module.exports = {
    tokenlogInVerify,
    verifyRefreshToken,
    tokenProviderlogInVerify,
}