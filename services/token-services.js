'use strict'

var jwt = require('jwt-simple');
var secret = 'hqQw0P7dUW4Q2TV2J9W9Ig5hF6ks21DASoX8S';

function getTokens(user, req) {
    for (var i of req) console.log(i);
}