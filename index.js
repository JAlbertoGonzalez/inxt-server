const express = require('express')
const app = express()

const router = require('./src/routes/index')

const routesPrefix = '/api'

app.use(routesPrefix, router)

app.listen(3000, function () {
    console.log("Node server running on http://localhost:3000");
});
