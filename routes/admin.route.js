const express = require('express')
const adminRouter = express.Router()
require('dotenv').config()

const { checkJWT, checkAdminRole } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')

adminRouter.get('/users', checkJWT, checkAdminRole, async(req, res) => {
    const usersDb = db.collection('users')
    const responseUser = await usersDb.get()
    let arrayUser = []
    responseUser.forEach(doc => {
        let data = {
            id: doc.data().id,
            fullName: doc.data().fullName,
            email: doc.data().email,
            role: doc.data().role
        }
        arrayUser.push(data)
    })

    res.send(arrayUser)
})

module.exports = adminRouter