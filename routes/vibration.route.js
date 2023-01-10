const express = require('express')
const vibrationRouter = express.Router()

const { checkJWT, checkVibrationOwnership } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')

vibrationRouter.post('/add-data', checkJWT, async(req, res) => {
    const data = await req.body
    const verified = await req.verified
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        mtbf: data.mtbf,
        reliability: data.reliability,
        userId: verified.id
    }
    
    const vibrationsDb = db.collection('vibrations').doc(id)
    await vibrationsDb.set(json)
    res.status(201).json({
        message: "Vibration Sensor Created"
    })
})

vibrationRouter.post('/:id/add-history', checkJWT, checkVibrationOwnership, async (req, res) => {
    const data = await req.body
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        name: data.name
    }

    const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection('history').doc(id)
    await vibrationsDb.set(json)
    res.status(201).json({message: "Vibration History Created"})
})

vibrationRouter.post('/:id/:idHistory/add-data', checkJWT, checkVibrationOwnership, async (req, res) => {
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
    res.status(201).json({message: "Vibration History Data Created"})
})

vibrationRouter.get('/all', checkJWT, async (req, res) => {
    const verified = req.verified

    const vibrationsDb = db.collection('vibrations')
    const response = await vibrationsDb.where('userId', '==', verified.id).get()

    let dataArray = []
    response.forEach(doc => {
        dataArray.push(doc.data())
    })

    res.send(dataArray)
})

vibrationRouter.get('/:id', checkJWT, checkVibrationOwnership, async (req, res) => {
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

vibrationRouter.get('/:id/:idHistory', checkJWT, checkVibrationOwnership, async (req, res) => {
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

vibrationRouter.delete('/:id/:idHistory', checkJWT, checkVibrationOwnership, async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const vibrationHistoriesDb = vibrationsDb.collection('history').doc(req.params.idHistory)

    await vibrationHistoriesDb.delete()
    res.status(202).json({message: "Vibration History Deleted"})
})

vibrationRouter.delete('/:id/:idHistory/:idData', checkJWT, checkVibrationOwnership, async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const vibrationHistoriesDb = vibrationsDb.collection('history').doc(req.params.idHistory)
    const vibrationHistoryDatasDb = vibrationHistoriesDb.collection('data').doc(req.params.idData)

    await vibrationHistoryDatasDb.delete()
    res.status(202).json({message: "Vibration History Data Deleted"})
})

module.exports = vibrationRouter