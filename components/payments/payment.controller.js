'use strict'

var PaymentModel = require('./payment.model');
var log = require('../../logs');
var mercadopago = require('mercadopago');
const https = require('https');
const tokenAccess = '';
//const tokenAccess = '';
var UserModel = require('../user/user.model');

var ProviderModel = require('../provider/provider.model');
var moment = require('moment')
var GLOBALS = require('../../globals/globals')


mercadopago.configure({
    sandbox: true,
    access_token: tokenAccess
});

function listenMercadoPago(req, res) {
    var id_payment = req.query["data.id"];
    res.status(201).send();


    https.get('https://api.mercadopago.com/v1/payments/' + id_payment + '?access_token=' + tokenAccess, (resp) => {
        var data = '';
        resp.on('data', (chunk) => {
            data += chunk;

            var dataJson = (JSON.parse(data));
            if (dataJson.status == 'approved') {
                PaymentModel.findByIdAndUpdate(dataJson.external_reference, { id_payment: dataJson.id, registered: true }, (err, payment) => {
                    if (err) log.logErrJSON(log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error searching payment', err);
                    else if (payment) {
                        if (!payment.registered) {
                            switch (payment.pay_type) {
                                case GLOBALS.PAY_TYPES.PUBLICATION_ADD:
                                    AddModel.findById(payment.id_add, (err, adds) => {
                                        if (err) return log.logErrJSON(log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error searching publication add', err);
                                        adds.publication_add_config.current_balance_app = adds.total_balance_app;
                                        if (GLOBALS.FLAGS.promo_web_free) adds.publication_add_config.current_balance_web = adds.total_balance_web + (adds.total_balance_app * 0.3); //PROMOCION!! 
                                        else adds.publication_add_config.current_balance_web = adds.total_balance_web; //SIN PROMOCION
                                        adds.save((err, savedAdds) => {
                                            if (err) log.logErrJSON(log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error updating balance on publication Adds', err)
                                            else log.logJSONinfo(savedAdds, log.ERR_CODES.OK, 'Success');
                                        })
                                    });
                                    break;
                                case GLOBALS.PAY_TYPES.SIDE_ADD:
                                    AddModel.findById(payment.id_add, (err, adds) => {
                                        if (err) return log.logErrJSON(log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error searching side add', err);

                                        adds.side_add_config.pay_info.payed = true;
                                        adds.side_add_config.pay_info.pay_id = payment._id;
                                        adds.save((err, savedAdds) => {
                                            if (err) log.logErrJSON(log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error updating balance on side Adds', err)
                                            else log.logJSONinfo(savedAdds, log.ERR_CODES.OK, 'Success');
                                        })
                                    });
                                    break;
                                case GLOBALS.PAY_TYPES.SUBSCRIPTION:
                                    ProviderModel.findById(payment.id_user, (err, prov) => {
                                        if (err) return log.logErrJSON(log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error searching provider', err);

                                        var provider_date = moment(prov.subscription_date);
                                        var now = moment(new Date());

                                        if (provider_date.isBefore(now)) prov.subscription_date = now.add(payment.n_months, 'months').toDate();
                                        else prov.subscription_date = provider_date.add(payment.n_months, 'months').toDate();

                                        prov.save((err, newProv) => {
                                            if (err) return log.logErrJSON(log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error saving provider subscription', err);
                                            else log.logJSONinfo(newProv._id, log.ERR_CODES.OK, 'Updated provider subscription_date');
                                        })

                                    });
                                    break;
                                default:
                                    return;
                            }
                        }
                    } else {
                        log.logJSON(log.ERR_CODES.ADD_NO_FOUND, "Payment not found listening Mercado Pago");
                    }
                })
            }
        });
    })
}




/**
 * @author RagauSoft:Ivan Quiroga
 * @description Permite obtener todas las mascotas en el lenguaje indicado
 * @param {String} req.tokeninfo - TokenInfo (OBLIGATORIO)
 * @param {String} req.body.payer - Correo del usuario (OBLIGATORIO)
 * @param {String} req.body.id_add - Id del add a pagar (OBLIGATORIO)
 * @param {String} req.body.amount - Cantidad del add a pagar (OBLIGATORIO)
 * @param {String} req.body.linkSuccess - Link en caso de exito en la transacción (OBLIGATORIO)
 * @param {String} req.body.linkFailure - Link en caso de fallo en la transacción (OBLIGATORIO)
 * @param {String} req.body.linkPending - Link en caso de espera en la transacción (OBLIGATORIO)
 * @return Si no se envia id se enviará un estado 400 con el comentario: 'The languague is obligatory' 
 * @return Si ocurre un error al buscar las mascotas se enviará un estado 500 con el comentario: 'Error searching pets'
 * @return Si encuentra el evento enviará un estado 200 con el comentario 'Success' y la info: pets 
 */
function chargeBalanceAddPublication(req, res) {
    var isValidAmount = false;
    //if (!verifyTokenProvider(req, res)) return;
    if (!req.body.payer) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The payer is obligatory');
    else if (!req.body.id_add) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The id_add is obligatory');
    else if (!req.body.amount) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The amount is obligatory');
    else if (!req.body.linkSuccess) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The linkSuccess is obligatory');
    else if (!req.body.linkFailure) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The linkFailure is obligatory');
    else if (!req.body.linkPending) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The linkPending is obligatory');
    else {
        AddModel.findById(req.body.id_add, (err, add) => {
            if (err) log.logErrJSONAndResponse(res, 500, log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error searching add', err);
            else if (!add) log.response(res, 404, log.ERR_CODES.USER_NO_FOUND, 'Add not found');
            else if ((add.total_balance_app + add.total_balance_web) != req.body.amount) {
                log.response(res, 400, log.ERR_CODES.INTERNAL_INVALID_INFORMATION, 'Amount Charged is not equal to total balance of add');
                return;
            }

            var myPayment = new PaymentModel();
            myPayment.description = GLOBALS.PAYMENT_DESCRIPTIONS.pay_for_publication_add;
            myPayment.user_type = req.tokenInfo.user_type;
            myPayment.id_user = req.tokenInfo.user_id;
            myPayment.id_add = req.body.id_add;
            myPayment.amount = req.body.amount;
            myPayment.id_payment = 'Not Defined';
            myPayment.pay_type = GLOBALS.PAY_TYPES.PUBLICATION_ADD;

            myPayment.save((err, newPay) => {
                if (err) log.logErrJSONAndResponse(res, 500, log.ERR_CODES.DATABASE_INSERT_ERROR, 'Error creating payment', err);
                else if (!newPay) log.logErrJSONAndResponse(res, 500, log.ERR_CODES.DATABASE_INSERT_ERROR, 'Error creating payment. Payment not stored');
                else {
                    var preference = {
                        items: [{
                            id: '2',
                            title: myPayment.description,
                            quantity: 1,
                            currency_id: 'COP',
                            unit_price: parseInt(req.body.amount),
                        }],
                        payer: {
                            email: req.body.payer
                        },
                        back_urls: {
                            'success': req.body.linkSuccess,
                            'failure': req.body.linkFailure,
                            'pending': req.body.linkPending
                        },
                        auto_return: 'approved',
                        external_reference: newPay._id.toString()
                    };
                    mercadopago.preferences.create(preference).then(function(preference) {
                        log.responseInfo(res, 200, preference.body.init_point, log.ERR_CODES.OK, 'Success')
                    }).catch(function(error) {
                        log.logErrJSONAndResponse(res, 500, log.ERR_CODES.PAYMENT_ERR, 'Error creating preference', error)
                    });
                }
            })
        })
    }
}


/**
 * @author RagauSoft:Ivan Quiroga
 * @description Permite obtener todas las mascotas en el lenguaje indicado
 * @param {String} req.tokeninfo - TokenInfo (OBLIGATORIO)
 * @param {String} req.body.payer - Correo del usuario (OBLIGATORIO)
 * @param {String} req.body.id_add - Id del add a pagar (OBLIGATORIO)
 * @param {String} req.body.linkSuccess - Link en caso de exito en la transacción (OBLIGATORIO)
 * @param {String} req.body.linkFailure - Link en caso de fallo en la transacción (OBLIGATORIO)
 * @param {String} req.body.linkPending - Link en caso de espera en la transacción (OBLIGATORIO)
 * @return Si no se envia id se enviará un estado 400 con el comentario: 'The languague is obligatory' 
 * @return Si ocurre un error al buscar las mascotas se enviará un estado 500 con el comentario: 'Error searching pets'
 * @return Si encuentra el evento enviará un estado 200 con el comentario 'Success' y la info: pets 
 */
function chargeBalanceAddSide(req, res) {
    //if (!verifyTokenProvider(req, res)) return;
    if (!req.body.payer) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The payer is obligatory');
    else if (!req.body.id_add) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The id_add is obligatory');
    else if (!req.body.linkSuccess) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The linkSuccess is obligatory');
    else if (!req.body.linkFailure) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The linkFailure is obligatory');
    else if (!req.body.linkPending) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The linkPending is obligatory');
    else {
        AddModel.findById(req.body.id_add, (err, add) => {
            if (err) log.logErrJSONAndResponse(res, 500, log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error searching add', err);
            else if (!add) log.response(res, 404, log.ERR_CODES.ADD_NO_FOUND, 'Add not found');
            else {
                var myPayment = new PaymentModel();
                myPayment.description = GLOBALS.PAYMENT_DESCRIPTIONS.pay_for_side_add;
                myPayment.user_type = req.tokenInfo.user_type;
                myPayment.id_user = req.tokenInfo.user_id;
                myPayment.id_add = req.body.id_add;
                myPayment.amount = add.side_add_config.price;
                myPayment.id_payment = 'Not Defined';
                myPayment.pay_type = GLOBALS.PAY_TYPES.SIDE_ADD;


                myPayment.save((err, newPay) => {
                    if (err) log.logErrJSONAndResponse(res, 500, log.ERR_CODES.DATABASE_INSERT_ERROR, 'Error creating payment', err);
                    else if (!newPay) log.logErrJSONAndResponse(res, 500, log.ERR_CODES.DATABASE_INSERT_ERROR, 'Error creating payment. Payment not stored');
                    else {
                        var dateTo = moment(add.side_add_config.pay_info.time_expires).format();
                        var formatting = dateTo.substring(0, 19);
                        formatting += ".000-";
                        formatting += dateTo.substring(20, 25);
                        dateTo = moment().format();
                        var formatting2 = dateTo.substring(0, 19);
                        formatting2 += ".000-";
                        formatting2 += dateTo.substring(20, 25);
                        var preference = {
                            items: [{
                                id: '3',
                                title: newPay.description,
                                quantity: 1,
                                currency_id: 'COP',
                                unit_price: parseInt(newPay.amount),
                            }],
                            payer: {
                                email: req.body.payer
                            },

                            expires: true,
                            expiration_date_from: formatting2,
                            expiration_date_to: formatting,
                            back_urls: {
                                'success': req.body.linkSuccess,
                                'failure': req.body.linkFailure,
                                'pending': req.body.linkPending
                            },
                            auto_return: 'approved',
                            external_reference: newPay._id.toString()
                        };
                        mercadopago.preferences.create(preference).then(function(preference) {
                            log.responseInfo(res, 200, preference.body.init_point, log.ERR_CODES.OK, 'Success')
                        }).catch(function(error) {
                            log.logErrJSONAndResponse(res, 500, log.ERR_CODES.PAYMENT_ERR, 'Error creating preference', preference.expiration_date_from)
                        });
                    }
                });
            }
        });
    }
}



/**
 * @author RagauSoft:German Guerrero
 * @description Permite pagar una subscripción
 * @param {String} req.tokeninfo - TokenInfo (OBLIGATORIO)
 * @param {String} req.body.payer - Correo del usuario (OBLIGATORIO)
 * @param {String} req.body.months - Numero de meses a pagar (OBLIGATORIO)
 * @param {String} req.body.linkSuccess - Link en caso de exito en la transacción (OBLIGATORIO)
 * @param {String} req.body.linkFailure - Link en caso de fallo en la transacción (OBLIGATORIO)
 * @param {String} req.body.linkPending - Link en caso de espera en la transacción (OBLIGATORIO)
 * @return Si no se envia id se enviará un estado 400 con el comentario: 'The languague is obligatory' 
 * @return Si ocurre un error al buscar las mascotas se enviará un estado 500 con el comentario: 'Error searching pets'
 * @return Si encuentra el evento enviará un estado 200 con el comentario 'Success' y la info: pets 
 */
function paySubscription(req, res) {
    var months;
    if (!verifyTokenProvider(req, res)) return;
    else if (!req.body.payer) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The payer is obligatory');
    else if (!req.body.months) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The months is obligatory');
    else if (isNaN(months = Number(req.body.months))) log.response(res, 400, log.ERR_CODES.INVALID_PARAMETER, req.body.months + ' is not a number');
    else if (!req.body.linkSuccess) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The linkSuccess is obligatory');
    else if (!req.body.linkFailure) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The linkFailure is obligatory');
    else if (!req.body.linkPending) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The linkPending is obligatory');
    else {
        ProviderModel.findById(req.tokenInfo.user_id, (err, provider) => {
            if (err) log.logErrJSONAndResponse(res, 500, log.ERR_CODES.DATABASE_SEARCH_ERROR, 'Error searching provider', err);
            else if (!provider) log.response(res, 404, log.ERR_CODES.PROVIDER_NO_FOUND, 'Provider not found');
            else {

                var pioneerType = 0;
                if (!provider.pioneer.used_first_pioneer_discount) pioneerType = provider.pioneer.pioneer_type;
                var price = calcSubscriptionPrice(months, pioneerType);

                var myPayment = new PaymentModel();
                myPayment.description = GLOBALS.PAYMENT_DESCRIPTIONS.pay_provider_subscription;
                myPayment.user_type = req.tokenInfo.user_type;
                myPayment.id_user = req.tokenInfo.user_id;
                myPayment.n_months = months;
                myPayment.amount = price.total;
                myPayment.id_payment = 'Not Defined';
                myPayment.pay_type = GLOBALS.PAY_TYPES.SUBSCRIPTION

                myPayment.save((err, newPay) => {
                    if (err) log.logErrJSONAndResponse(res, 500, log.ERR_CODES.DATABASE_INSERT_ERROR, 'Error creating payment', err);
                    else if (!newPay) log.logErrJSONAndResponse(res, 500, log.ERR_CODES.DATABASE_INSERT_ERROR, 'Error creating payment. Payment not stored');
                    else {
                        var preference = {
                            items: [{
                                id: '4',
                                title: myPayment.description,
                                quantity: months,
                                currency_id: 'COP',
                                unit_price: price.unit,
                            }],
                            payer: {
                                email: req.body.payer
                            },

                            back_urls: {
                                'success': req.body.linkSuccess,
                                'failure': req.body.linkFailure,
                                'pending': req.body.linkPending
                            },
                            auto_return: 'approved',
                            external_reference: newPay._id.toString(),
                        };
                        mercadopago.preferences.create(preference).then(function(preference) {
                            log.responseInfo(res, 200, preference.body.init_point, log.ERR_CODES.OK, 'Success')
                        }).catch(function(error) {
                            log.logErrJSONAndResponse(res, 500, log.ERR_CODES.PAYMENT_ERR, 'Error creating preference', error.toString())
                        });
                    }
                });
            }
        });
    }
}

/**
 * @author RagauSoft:German Guerrero
 * @description Permite obtener el precio de una subscripción
 * @param {String} req.params.months - Link en caso de espera en la transacción (OBLIGATORIO)
 * @param {String} req.params.pioneer_type - tipo de pionero en caso de que aplique
 * @return Envia el cálculo de el costo de una subscripcion
 */
function getPriceSubscriptionProvider(req, res) {
    if (!req.params.months) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The months are obligatory');
    else if (!req.params.pioneer_type) log.response(res, 400, log.ERR_CODES.MISSING_PARAMETER, 'The pioneer_type is obligatory');
    else {
        var months = Number(req.params.months);
        if (isNaN(months)) {
            log.response(res, 400, log.ERR_CODES.INVALID_PARAMETER, req.params.months + ' is not a number');
            return;
        }

        var pioneer_type = Number(req.params.pioneer_type);
        if (isNaN(pioneer_type)) {
            log.response(res, 400, log.ERR_CODES.INVALID_PARAMETER, req.params.pioneer_type + ' is not a number');
            return;
        }

        var price = calcSubscriptionPrice(months, pioneer_type);
        log.responseInfo(res, 200, price, log.ERR_CODES.OK, 'Success');
    }
}

function calcSubscriptionPrice(months, pioneer_type) {
    var price = 0;
    for (var price_config of GLOBALS.PRICE_MONTH) {
        if (price_config.numMonth > months) break;
        price = price_config.priceMonth;
    }

    var to_return = {
        unit: price,
        total: months * price,

    };

    return to_return;
}

module.exports = {
    listenMercadoPago,
    chargeBalanceAddPublication,
    chargeBalanceAddSide,
    paySubscription,
    getPriceSubscriptionProvider,
}