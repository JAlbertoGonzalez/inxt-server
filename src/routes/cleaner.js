// Services
const CleanUserService = require('../services/cleaner/userCleanerService')
const CleanBucketService = require('../services/cleaner/bucketCleanerService')


module.exports = (router, db) => {
    const Models = db.models

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
}