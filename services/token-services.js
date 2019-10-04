'use strict'

var jwt = require('jwt-simple');
var secret = 'hqQw0P7dUW4Q2TV2J9W9Ig5hF6ks21DASoX8S';
var moment = require('moment');

function getTokens(user, req) {
    var ip = req.connection.remoteAddress;




}

module.exports = {
    getTokens: getTokens,
}