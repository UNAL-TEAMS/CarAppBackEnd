'use strict'

var jwt = require('jwt-simple');
var secret = 'hqQw0P7dUW4Q2TV2J9W9Ig5hF6ks21DASoX8S';
var moment = require('moment');

var TOKEN_TYPES = {
    REFRESH: 'refresh',
    LOG_IN: 'log_in',
}

function getLogInToken(user) {
    var log_in_payload = {
        user_id: user._id,
        dead_time: moment().add(10, 'minutes').toDate(),
        type: TOKEN_TYPES.LOG_IN,
    };
    return jwt.encode(log_in_payload, secret);
}

function getRefreshToken(req, user) {
    var ip = req.connection.remoteAddress;

    var refresh_payload = {
        user_id: user._id,
        ip: ip,
        type: TOKEN_TYPES.REFRESH,
        date: moment().toDate(),
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
    res.status(200).send(getRefreshToken(req, req.token_user));
}

module.exports = {
    TOKEN_TYPES,
    getLogInToken,
    getRefreshToken,
    decodeToken,
    updateLogInToken,
}