'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var payment = Schema({
    id_provider: String,
    id_payment: String,
    description: String,
    amount: Number,
    registered: {
        type: Boolean,
        default: false
    },
    pay_type: String,
});

module.exports = mongoose.model('rs_payments', payment);