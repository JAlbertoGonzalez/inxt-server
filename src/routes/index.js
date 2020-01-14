const express = require('express')
const querystring = require('querystring')
const url = require('url')
const axios = require('axios')

const router = express.Router()

const Model = require('../services/modelService')

function getUrlParams(req) {
    const rawUrl = req.protocol + '://' + req.get('host') + req.originalUrl
    let parsedUrl = url.parse(rawUrl);
    let parsedQs = querystring.parse(parsedUrl.query);
    return parsedQs
}

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

    router.get('/contacts/online', (req, res) => {
        const parsedQs = getUrlParams(req)

        Models.Contact.find({ ...parsedQs, timeoutRate: { $lt: 0.04 } }, (err, result) => {
            if (err) {
                res.status(501).send({ error: err })
            } else {
                res.status(!result ? 400 : 200).send(result)
            }
        })
    })

    router.get('/users', (req, res) => {
        const parsedQs = getUrlParams(req)

        Models.User.find(parsedQs, (err, result) => {
            if (err) {
                res.status(501).send({ error: err })
            } else {
                res.status(!result ? 400 : 200).send(result)
            }
        })
    })

    router.get('/user/:email', (req, res) => {
        const email = req.params.email

        Models.User.findOne({ _id: email }, (err, result) => {
            if (err) {
                res.status(501).send({ error: err })
            } else {
                res.status(!result ? 400 : 200).send(result)
            }
        })
    })

    router.get('/user/:email/usage', (req, res) => {
        const email = req.params.email

        Models.Bucket.aggregate([
            {
                $match: {
                    user: email
                }
            },
            {
                $lookup: {
                    from: 'bucketentries',
                    localField: '_id',
                    foreignField: 'bucket',
                    as: 'join1'
                }
            },
            {
                $unwind: {
                    path: '$join1'
                }
            },
            {
                $lookup: {
                    from: "frames",
                    localField: "join1.frame",
                    foreignField: "_id",
                    as: "join2"
                }
            },
            {
                $unwind: {
                    path: '$join2'
                }
            },
            {
                $project: {
                    _id: '$join2._id',
                    user: '$join2.user',
                    size: '$join2.size'
                }
            },
            {
                $group: {
                    _id: '$user',
                    total: { $sum: '$size' }
                }
            }
        ], (err, results) => {
            if (err || !results || results.length == 0) {
                res.status(500).send({ error: 'Check server log for details' });
            }
            else {
                res.status(200).send(results[0])
            }
        })
    })

    router.get('/payments/contacts', (req, res) => {
        const parsedQs = getUrlParams(req)
        const days = parsedQs.days || 2

        var currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - days)

        Models.Contact.aggregate([
            {
                $match: {
                    timeoutRate: { $lt: 0.04 },
                    lastSeen: { $gte: currentDate }
                }
            },
            {
                $lookup: {
                    from: 'shards',
                    localField: '_id',
                    foreignField: 'contracts.nodeID',
                    as: 'shards'
                }
            },
            {
                $unwind: {
                    'path': '$shards.contracts'
                }
            },
            {
                $skip: 1
            },
            {
                $limit: 1
            }
        ], (err, results) => {
            if (err) {
                res.status(500).send({ error: err })
            } else {
                res.status(200).send(results)
            }
        })
    })

})


module.exports = router