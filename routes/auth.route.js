const express = require('express')
const authRouter = express.Router()
require('dotenv').config()

const { validateRegister, checkJWT } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

authRouter.post('/register', validateRegister, async (req, res) => {
    const data = await req.body

    const usersDb = db.collection('users')
    const responseUser = await usersDb.where('email', '==', data.email).get()
    let arrayUser = []
    responseUser.forEach(doc => {
        arrayUser.push(doc.data())
    })

    if (arrayUser.length < 1){
        const hashedPassword = bcrypt.hashSync(data.password, 10)
        data.password = hashedPassword

        const id = '_' + new Date().getTime()
        const json = {
            id: id,
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            role: data.role
        }

        const userDb = db.collection('users').doc(id)
        await userDb.set(json)
        res.status(201).json({
            message: "Register Success"
        })
    } else {
        res.status(401).json({
            message: "Email Registered"
        })
    }
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
                fullName: arrayUser[0].fullName,
                role: arrayUser[0].role
            }, process.env.JWTKEY, {expiresIn: '1d'})

            const userData = {
                id: arrayUser[0].id,
                email: arrayUser[0].email,
                fullName: arrayUser[0].fullName,
                role: arrayUser[0].role
            }

            res.send({
                message: "Login Success",
                userData,
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