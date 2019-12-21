const express = require('express')
const app = express()

const router = require('./src/routes/index')

app.use(router)

app.listen(3000, function () {
    console.log("Node server running on http://localhost:3000");
});
