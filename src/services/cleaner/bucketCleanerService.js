const mysql = require('../../sequelize/index')
const sql = mysql.GetConnectedDatabaseInstance()
const async = require('async')

function FindBucketsToBeRemoved(Models) {

    return new Promise((resolve, reject) => {
        Models.Bucket.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $match: { user: { $size: 0 } }
            }
        ], (err, results) => {
            if (err) { reject(err) }
            else { resolve(results) }
        })
    });
}

function CleanBuckets(Models) {

    return new Promise((resolve, reject) => {
        FindBucketsToBeRemoved(Models).then(buckets => {
            async.mapSeries(buckets, (bucket, next) => {
                Models.Bucket.deleteOne({ _id: bucket._id }, (err, result) => next(err))
            }, (err, results) => {
                if (err) { reject(err); }
                else { resolve(results); }
            });
        }).catch(err => {
            reject(err);
        });
    });

}

module.exports = {
    FindBucketsToBeRemoved,
    CleanBuckets
}