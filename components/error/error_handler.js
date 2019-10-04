'use strict'

function mongoError(err, res, info) {
    res.staus(500).send({ info, err });
}

module.exports = {
    mongoError,
};