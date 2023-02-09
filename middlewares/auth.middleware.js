const { body, validationResult } = require('express-validator')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const { db } = require('../routes/firebase')

const validateRegister = [
    body('email')
        .isEmail()
        .withMessage('Invalid Email Address')
        .notEmpty()
        .withMessage("Email Must Be Filled"),
    body('password')
        .notEmpty()
        .withMessage('Password Must Be Filled'),
    body('fullName')
        .notEmpty()
        .withMessage('Full Name Must Be Filled'),
    body('role')
        .notEmpty()
        .withMessage('User Role Must Be Chosen'),
    (req, res, next) => {
        const error = validationResult(req).formatWith(({ msg }) => msg)

        const hasError = !error.isEmpty()
    
        if(hasError){
            res.status(422).json({error: error.array()})
        } else {
            next()
        }
    }
]

const checkJWT = async (req, res, next) => {
    const auth = await req.headers.authorization
    if (auth){
        const token = await auth.split(' ')[1]
        const verified =jwt.verify(token, process.env.JWTKEY)

        if (verified){
            req.verified = verified
            next()
        } else {
            res.sendStatus(401)
        }
    } else {
        res.status(401).json({message: "Token Required"})
    }
}

// const checkFlowOwnership = async (req, res, next) => {
//     const verified = req.verified

//     const flowsDb = db.collection('flows')
//     const response = await flowsDb.doc(req.params.id).get()

//     if (response.data().userId == verified.id){
//         next()
//     } else {
//         res.sendStatus(401)
//     }
// }

// const checkVibrationOwnership = async (req, res, next) => {
//     const verified = req.verified

//     const vibrationsDb = db.collection('vibrations')
//     const response = await vibrationsDb.doc(req.params.id).get()

//     if (response.data().userId == verified.id){
//         next()
//     } else {
//         res.sendStatus(401)
//     }
// }

const checkAdminRole = async (req, res, next) => {
    const verified = req.verified

    if (verified.role == "admin"){
        next()
    } else {
        res.sendStatus(401)
    }
}

module.exports = { validateRegister, checkJWT, checkAdminRole }