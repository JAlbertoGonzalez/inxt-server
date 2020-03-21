const ConfigService = require('../services/configService')

const ServerList = [
    {
        name: 'X Cloud Web'
    },
    {
        name: 'X Cloud Server'
    },
]

module.exports = (router) => {
    router.get('/checker/getlist', (req, res) => {
        res.status(200).send(ServerList)
    })
}