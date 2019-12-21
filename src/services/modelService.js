const Storage = require('storj-service-storage-models')
const config = require('./configService')


const db = new Storage(config.storage.mongoUrl, {
    ...config.storage.mongoOpts
})

const promise = new Promise((resolve, reject) => {
    db.connection.on('connected', () => resolve(db))
})

module.exports = promise