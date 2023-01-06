const express = require('express')

const router = express.Router()
// const categoryRouter = require('./category.route')
// const countryRouter = require('./country.route')
// const userRouter = require('./user.route')
// const newsRouter = require('./news.route')

router.get('/', (req, res) => {
    res.send('Hello World')
})
// router.use('/category', categoryRouter)
// router.use('/country', countryRouter)
// router.use('/news', newsRouter)
// router.use('/user', userRouter)

module.exports = router