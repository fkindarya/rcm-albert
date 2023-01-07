const express = require('express')
const router = express.Router()
const flowRouter = require('./flow.route')
const vibrationRouter = require('./vibration.route')

router.get('/', (req, res) => {
    res.send('Hello World')
})
router.use('/flow-sensor', flowRouter)
router.use('/vibration-sensor', vibrationRouter)

module.exports = router