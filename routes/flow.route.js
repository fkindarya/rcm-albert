const express = require('express')
const flowRouter = express.Router()
const { db } = require('./firebase')

flowRouter.post('/data', async(req, res) => {
    const data = await req.body
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        mtbf: data.mtbf,
        reliability: data.reliability,
        history: []
    }
    console.log(json)
    
    const response = await db.collection('flows').doc(id).set(json)
    
    res.send(response)
})

flowRouter.get('/data', async (req, res) => {
    const flowsDb = db.collection('flows')
    const response = await flowsDb.get()

    let dataArray = []
    response.forEach(data => {
        dataArray.push(data.data())
    })

    res.send(dataArray)
})

module.exports = flowRouter