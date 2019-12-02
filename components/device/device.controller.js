'use strict'

function test(req, res) {
    res.status(200).send({ ok: 'ok' });
    console.log("Iegoooooo");
}

function km(req, res) {
    res.status(200).send({ ok: 'ok' });
    
}

module.exports = {
    test,
}