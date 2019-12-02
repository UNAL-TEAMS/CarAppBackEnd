'use strict'

function mongoError(err, res, info) {
    res.staus(500).send({ info, err });
}

function handleError(err, info) {
    console.error(info, err);
}

module.exports = {
    mongoError,
    handleError,
};