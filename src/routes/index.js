const express = require('express')
const querystring = require('querystring')
const url = require('url')

const router = express.Router()

const Model = require('../services/modelService')

Model.then(db => {
    const Models = db.models

    router.get('/contact/:nodeid', (req, res) => {
        const nodeid = req.params.nodeid

        Models.Contact.findOne({ _id: nodeid }, (err, result) => {
            if (err) {
                res.status(501).send({ error: err })
            } else {
                res.status(!result ? 400 : 200).send(result)
            }
        })
    })

    router.get('/contacts', (req, res) => {
        const rawUrl = req.protocol + '://' + req.get('host') + req.originalUrl
        let parsedUrl = url.parse(rawUrl);
        let parsedQs = querystring.parse(parsedUrl.query);

        Models.Contact.find(parsedQs, (err, result) => {
            if (err) {
                res.status(501).send({ error: err })
            } else {
                res.status(!result ? 400 : 200).send(result)
            }
        })
    })
})


module.exports = router