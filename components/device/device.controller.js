'use strict'

const UserModel = require('../user/user.model');
const error = require('../error/error_handler');

function test(req, res) {
    res.status(200).send({ ok: 'ok' });
    console.log("Iegoooooo");
}

async function km(req, res) {
    res.status(200).send({ ok: 'ok' });
    const { err, user } = await UserModel.updateOne({ 'cars.license_plate': req.params.plate }, { 'cars.$.currentKilometer': Number(req.params.value) }, { new: true, useFindAndModify: true });
    if (err) error.handleError(err, 'Error searching user on device.km');
    console.log('Updated user: ', new Date());
}

module.exports = {
    test,
    km,
}