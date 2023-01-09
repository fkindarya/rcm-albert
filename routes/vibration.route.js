const express = require('express')
const vibrationRouter = express.Router()
const { db } = require('./firebase')

vibrationRouter.post('/add-data', async(req, res) => {
    const data = await req.body
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        mtbf: data.mtbf,
        reliability: data.reliability
    }
    
    const vibrationsDb = db.collection('vibrations').doc(id)
    const response = await vibrationsDb.set(json)
    res.send(response)
})

vibrationRouter.post('/:id/add-history', async (req, res) => {
    const data = await req.body
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        name: data.name
    }

    const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection('history').doc(id)
    const response = await vibrationsDb.set(json)
    res.send(response)
})

vibrationRouter.post('/:id/:idHistory/add-data', async (req, res) => {
    const data = await req.body

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        duration: data.duration,
        time: data.time,
        status: data.status
    }

    const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data').doc(id)
    const response = await vibrationsDb.set(json)
    res.send(response)
})

vibrationRouter.get('/all', async (req, res) => {
    const vibrationsDb = db.collection('vibrations')
    const response = await vibrationsDb.get()

    let dataArray = []
    response.forEach(doc => {
        dataArray.push(doc.data())
    })

    res.send(dataArray)
})

vibrationRouter.get('/:id', async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const responsevibration = await vibrationsDb.get()
    
    const vibrationHistoriesDb = vibrationsDb.collection('history')
    const responsevibrationHistories = await vibrationHistoriesDb.get()

    let arrayHistory = []
    responsevibrationHistories.forEach(doc => {
        arrayHistory.push(doc.data())
    })

    res.send({
        vibrations: responsevibration.data(),
        vibrationHistories: arrayHistory
    })
})

vibrationRouter.get('/:id/:idHistory', async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const responsevibration = await vibrationsDb.get()

    const vibrationHistoriesDb = vibrationsDb.collection('history').doc(req.params.idHistory)
    const responsevibrationHistory = await vibrationHistoriesDb.get()

    const vibrationHistoryDatasDb = vibrationHistoriesDb.collection('data')
    const responsevibrationHistoryData = await vibrationHistoryDatasDb.get()

    let arrayHistoryData = []
    responsevibrationHistoryData.forEach(doc => {
        arrayHistoryData.push(doc.data())
    })

    res.send({
        vibrations: responsevibration.data(),
        vibrationHistories: responsevibrationHistory.data(),
        vibrationHistoryData: arrayHistoryData
    })
})

vibrationRouter.delete('/:id/:idHistory/:idData', async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const vibrationHistoriesDb = vibrationsDb.collection('history').doc(req.params.idHistory)
    const vibrationHistoryDatasDb = vibrationHistoriesDb.collection('data').doc(req.params.idData)

    const response = await vibrationHistoryDatasDb.delete()
    res.send(response)
})

module.exports = vibrationRouter