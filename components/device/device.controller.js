'use strict'

function test(req, res) {
    res.status(200).send({ ok: 'ok' });
    console.log("Iegoooooo");
}

module.exports = {
    test,
}