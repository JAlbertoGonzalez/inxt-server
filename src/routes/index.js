const express = require('express')
const querystring = require('querystring')
const url = require('url')
const axios = require('axios')
const async = require('async')

// Services
const CleanUserService = require('../services/cleaner/userCleanerService')
const CleanBucketService = require('../services/cleaner/bucketCleanerService')

const router = express.Router()

const Model = require('../services/modelService')

const GithubRoutes = require('./github')
const CheckerRoutes = require('./servers')

function getUrlParams(req) {
    const rawUrl = req.protocol + '://' + req.get('host') + req.originalUrl
    let parsedUrl = url.parse(rawUrl);
    let parsedQs = querystring.parse(parsedUrl.query);
    return parsedQs
}

Model.then(db => {
    const Models = db.models

    GithubRoutes(router)
    CheckerRoutes(router)

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
                $unwind: { 'path': '$shards.contracts' }
            },
            { $skip: 1 },
            { $limit: 1 }
        ], (err, results) => {
            if (err) {
                res.status(500).send({ error: err })
            } else {
                res.status(200).send(results)
            }
        })
    })

    router.get('/mysql/user/:email', (req, res) => {
        const email = req.params.email

        sql.then(instance => {
            instance.models.users.findOne({ where: { email: email } }).then(user => {
                res.status(200).send(user);
            }).catch(err => {
                res.status(501).send({ error: err })
            });
        }).catch(err => {
            res.status(501).send({ error: err })
        });

    })

    router.get('/bridge/clean/users/list', (req, res) => {
        CleanUserService.FindUsersToBeRemoved(Models).then(results => {
            res.send(results);
        }).catch(err => {
            res.status(501).send(err);
        });
    })

    router.get('/bridge/clean/users/remove', (req, res) => {
        CleanUserService.CleanUsers(Models).then(results => {
            res.status(200).send({ totalDeleted: results.deletedCount });
        }).catch(err => {
            res.status(501).send(err);
        });
    })

    router.get('/bridge/clean/buckets/list', (req, res) => {
        CleanBucketService.FindBucketsToBeRemoved(Models).then(results => {
            res.send(results);
        }).catch(err => {
            res.status(501).send(err);
        });
    })

    router.get('/bridge/clean/buckets/remove', (req, res) => {
        CleanBucketService.CleanBuckets(Models).then(results => {
            res.status(200).send({ totalDeleted: results.deletedCount });
        }).catch(err => {
            res.status(501).send(err);
        });
    })

    router.get('/user/:email/cleanfiles', (req, res) => {
        const email = req.params.email

        const mysql = require('../sequelize/index')
        const sql = mysql.GetConnectedDatabaseInstance()

        // Get all files present on MySQL
        async.waterfall([
            (next) => {
                sql.then(instance => next(null, instance)).catch(err => next(err))
            },
            (instance, next) => {
                instance.models.users
                    .findOne({
                        where: { email: email }, include: [{
                            model: instance.models.folder
                        }]
                    })
                    .then(user => next(null, user))
                    .catch(err => next(err));
            }
        ], (err, results) => {
            if (err) {
                console.log(err)
                res.status(500).send({ error: err })
            } else {
                res.status(200).send({ result: results })
            }
        })
    })



})


module.exports = router