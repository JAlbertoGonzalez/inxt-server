const mysql = require('../../sequelize/index')
const sql = mysql.GetConnectedDatabaseInstance()
const async = require('async')

// RFC 5322 Official Standard 
const emailPattern = /^((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*"))@((?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))$/i

const USER_DAYS = 7;

function getQuery() {
    const aWeekAgo = new Date();
    aWeekAgo.setDate(aWeekAgo.getDate() - USER_DAYS);

    const query = {
        $or: [{
            activated: false,
            isFreeTier: true,
            created: { $lt: aWeekAgo }
        }, {
            _id: { $not: emailPattern }
        }, {
            _id: /uuluu\.org$/
        }]
    }
    return query
}

function FindUsersToBeRemoved(Models) {


    return new Promise((resolve, reject) => {
        Models.User.find(getQuery(), (err, results) => {
            if (err) { reject(err) }
            else { resolve(results) }
        })
    });
}

function CleanUsers(Models) {
    const aWeekAgo = new Date();
    aWeekAgo.setDate(aWeekAgo.getDate() - USER_DAYS);

    return new Promise((resolve, reject) => {
        Models.User.deleteMany(getQuery(), (err, results) => {
            if (err) { reject(err) }
            else { resolve(results) }
        })
    });
}

module.exports = {
    FindUsersToBeRemoved,
    CleanUsers
}