const express = require('express')
const vibrationRouter = express.Router()
const { db } = require('./firebase')

vibrationRouter.post('/data', async(req, res) => {
    const data = await req.body
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        mtbf: data.mtbf,
        reliability: data.reliability,
        history: []
    }
    console.log(json)
    
    const response = await db.collection('vibrations').doc(id).set(json)
    
    res.send(response)
})

vibrationRouter.get('/data', async (req, res) => {
    const vibrationsDb = db.collection('vibrations')
    const response = await vibrationsDb.get()

    let dataArray = []
    response.forEach(data => {
        dataArray.push(data.data())
    })

    res.send(dataArray)
})

module.exports = vibrationRouter