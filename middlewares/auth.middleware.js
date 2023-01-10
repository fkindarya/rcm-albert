const { body, validationResult } = require('express-validator')

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

}

module.exports = { validateRegister }