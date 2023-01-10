const express = require('express')
const authRouter = express.Router()
require('dotenv').config

const { validateRegister } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

authRouter.post('/register', validateRegister, async (req, res) => {
    const data = await req.body

    const hashedPassword = bcrypt.hashSync(data.password, 10)
    data.password = hashedPassword

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        loginToken: "",
        deviceToken: ""
    }

    const usersDb = db.collection('users').doc(id)
    await usersDb.set(json)
    res.send({
        message: "Register Success"
    })
})

authRouter.post('/login', async (req, res) => {
    const data = await req.body

    const usersDb = db.collection('users')
    const responseUser = await usersDb.where('email', '==', data.email).get()
    let arrayUser = []
    responseUser.forEach(doc => {
        arrayUser.push(doc.data())
    })

    if (arrayUser.length < 1){
        res.status(401).json({
            message: "Email is not registered"
        })
    } else {
        const check = bcrypt.compareSync(data.password, arrayUser[0].password)

        if (check) {
            const loginToken = jwt.sign({
                id: arrayUser[0].id,
                email: arrayUser[0].email,
                fullName: arrayUser[0].fullName
            }, process.env.JWTKEY)

            await usersDb.doc(arrayUser[0].id).update({
                loginToken: loginToken
            })

            res.send({
                message: "Login Success",
                loginToken
            })
        } else {
            res.status(401).json({
                message: "Invalid Password"
            })
        }
    }
})

module.exports = authRouter