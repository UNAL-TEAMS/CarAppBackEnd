'use strict'

var jwt = require('jwt-simple');
var secret = 'hqQw0P7dUW4Q2TV2J9W9Ig5hF6ks21DASoX8S';
var moment = require('moment');

var TOKEN_TYPES = {
    REFRESH: 'refresh',
    LOG_IN: 'log_in',
}

var USER_TYPES = {
    USER: 'User',
    PROVIDER: 'Provider',
}

function getLogInToken(user_id) {
    var log_in_payload = {
        user_id: user_id,
        dead_time: moment().add(10, 'minutes').toDate(),
        user_type: USER_TYPES.USER,
        type: TOKEN_TYPES.LOG_IN,
    };
    return jwt.encode(log_in_payload, secret);
}

function getLogInProviderToken(provider_id) {
    var log_in_payload = {
        user_id: provider_id,
        dead_time: moment().add(10, 'minutes').toDate(),
        user_type: USER_TYPES.PROVIDER,
        type: TOKEN_TYPES.LOG_IN,
    };
    return jwt.encode(log_in_payload, secret);
}

function getRefreshToken(req, user_id, user_type) {
    var ip = req.connection.remoteAddress;

    var refresh_payload = {
        user_id: user_id,
        ip: ip,
        type: TOKEN_TYPES.REFRESH,
        date: moment().toDate(),
        user_type: user_type,
    };

    return jwt.encode(refresh_payload, secret);
}

function decodeToken(token) {
    try {
        return jwt.decode(token, secret);
    } catch (ex) {
        return null;
    }
}

function updateLogInToken(req, res) {
    if (req._user_type == USER_TYPES.USER) res.status(200).send(getLogInToken(req._id));
    else res.status(200).send(getLogInProviderToken(req._id));
}

module.exports = {
    TOKEN_TYPES,
    USER_TYPES,
    getLogInToken,
    getRefreshToken,
    decodeToken,
    updateLogInToken,
    getLogInProviderToken,
}