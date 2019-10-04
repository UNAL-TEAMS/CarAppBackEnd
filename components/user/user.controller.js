'use strict'

var User = require('./user.model');
var tokens = require('../../services/token.service');

function logIn(req, res) {
    tokens.getTokens(null, req);
    res.status(200).send('oc');
}

module.exports = {
    logIn,
}