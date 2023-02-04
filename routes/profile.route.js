const express = require('express')
const profileRouter = express.Router()
require('dotenv').config()

const { checkJWT } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')

profileRouter.get('/me', checkJWT, async(req, res) => {
    const verified = req.verified

    const userDb = db.collection('users').doc(verified.id)
    const response = await userDb.get()
    const userData = {
        id: response.data().id,
        email: response.data().email,
        fullName: response.data().fullName,
        role: response.data().role
    }

    res.send(userData)
})

module.exports = profileRouter