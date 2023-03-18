const express = require('express')
const vibrationRouter = express.Router()

const { checkJWT, checkAdminRole } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')

vibrationRouter.post('/add-data', checkJWT, checkAdminRole, async(req, res) => {
    // const data = await req.body
    // const verified = await req.verified
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        // mtbf: data.mtbf,
        // reliability: data.reliability,
        // userId: verified.id
    }
    
    const vibrationsDb = db.collection('vibrations').doc(id)
    await vibrationsDb.set(json)
    res.status(201).json({
        message: "Vibration Sensor Created",
        data: id
    })
})

vibrationRouter.post('/:id/add-history', checkJWT, checkAdminRole, async (req, res) => {
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

vibrationRouter.post('/:id/add-reliability', checkJWT, checkAdminRole, async (req, res) => {
    const data = await req.body

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        reliability: data.value,
        createdAt: new Date()
    }

    const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection('reliability').doc(id)
    await vibrationsDb.set(json)
    res.status(201).json({message: "Vibration Reliability Created"})
})

vibrationRouter.post('/:id/add-mtbf', checkJWT, checkAdminRole, async (req, res) => {
    const data = await req.body

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        mtbf: data.value,
        createdAt: new Date()
    }

    const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection('mtbf').doc(id)
    await vibrationsDb.set(json)
    res.status(201).json({message: "Vibration MTBF Created"})
})

vibrationRouter.post('/:id/:idHistory/add-data', checkJWT, checkAdminRole, async (req, res) => {
    const data = await req.body

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        duration: data.duration,
        time: data.time,
        status: data.status,
        historyId: req.params.idHistory
    }

    const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data').doc(id)
    await vibrationsDb.set(json)
    res.status(201).json({message: "Vibration History Data Created"})
})

vibrationRouter.get('/all', checkJWT, async (req, res) => {
    // const verified = req.verified

    const vibrationsDb = db.collection('vibrations')
    const response = await vibrationsDb.get()
    // const response = await vibrationsDb.where('userId', '==', verified.id).get()

    let dataArray = []
    response.forEach(doc => {
        dataArray.push(doc.data())
    })

    res.send(dataArray)
})

vibrationRouter.get('/:id', checkJWT, async (req, res) => {
    const id = req.params.id
    const vibrationsDb = db.collection('vibrations').doc(id)
    const responseVibration = await vibrationsDb.get()

    let vibrations = {
        id: responseVibration.data().id
    }
    
    const vibrationHistoriesDb = vibrationsDb.collection('history')
    const responseVibrationHistories = await vibrationHistoriesDb.get()

    let arrayHistory = []
    responseVibrationHistories.forEach(doc => {
        arrayHistory.push(doc.data())
    })

    vibrations['history'] = arrayHistory
    let arrayHistoryDuration = []

    arrayHistory.forEach( async (doc, index) => {
        let arrayHistoryData = []
        let arrayHistoryDataTemp = []
        let getHistoryDatas = await db.collection('vibrations').doc(id).collection('history').doc(doc.id).collection('data').get()

        getHistoryDatas.forEach(doc => {
            if (arrayHistory[index].id == doc.data().historyId){
                arrayHistoryData.push(doc.data())
                arrayHistoryDuration.push(doc.data().duration)
            }
            else{
                arrayHistoryDataTemp.push(doc.data)
            }
        })

        vibrations['history'][index].data = arrayHistoryData
    })

    const vibrationReliabilitiesDb = vibrationsDb.collection('reliability')
    const responseVibrationReliabilities = await vibrationReliabilitiesDb.get()

    let arrayReliability = []
    responseVibrationReliabilities.forEach(doc => {
        arrayReliability.push(doc.data())
    })
    
    const vibrationMtbfDb = vibrationsDb.collection('mtbf')
    const responseVibrationMtbf = await vibrationMtbfDb.get()

    let arrayMtbf = []
    responseVibrationMtbf.forEach(doc => {
        arrayMtbf.push(doc.data())
    })

    let mtbf = 0
    let reliability = 0
    let tempSumMtbf = 0

    arrayHistoryDuration.forEach( data => {
        tempSumMtbf += data
    })

    mtbf = tempSumMtbf / arrayHistoryDuration.length
    reliability = 1 / (Math.pow(2.72, (12 / mtbf))).toFixed(1)

    vibrations['mtbf'] = mtbf
    vibrations['reliability'] = reliability

    res.send({
        vibrations
    })
})

vibrationRouter.get('/:id/:idHistory', checkJWT, async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const responseVibration = await vibrationsDb.get()

    let vibrations = {
        id: responseVibration.data().id
    }

    const vibrationHistoriesDb = vibrationsDb.collection('history').doc(req.params.idHistory)
    const responseVibrationHistory = await vibrationHistoriesDb.get()

    let history = {
        id: responseVibrationHistory.data().id,
        name: responseVibrationHistory.data().name
    }

    const vibrationHistoryDatasDb = vibrationHistoriesDb.collection('data')
    const responseVibrationHistoryData = await vibrationHistoryDatasDb.get()

    let arrayHistoryData = []
    responseVibrationHistoryData.forEach(doc => {
        arrayHistoryData.push(doc.data())
    })

    vibrations['history'] = history
    vibrations['history']['data'] = arrayHistoryData

    res.send({
        vibrations
    })
})

vibrationRouter.delete('/:id/history/:idHistory', checkJWT, checkAdminRole, async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const vibrationHistoriesDb = vibrationsDb.collection('history').doc(req.params.idHistory)

    await vibrationHistoriesDb.delete()
    res.status(202).json({message: "Vibration History Deleted"})
})

vibrationRouter.delete('/:id/reliability/:idReliability', checkJWT, checkAdminRole, async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const vibrationReliabilitiesDb = vibrationsDb.collection('reliability').doc(req.params.idReliability)

    await vibrationReliabilitiesDb.delete()
    res.status(202).json({message: "Vibration Reliability Deleted"})
})

vibrationRouter.delete('/:id/mtbf/:idMtbf', checkJWT, checkAdminRole, async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const vibrationReliabilitiesDb = vibrationsDb.collection('mtbf').doc(req.params.idMtbf)

    await vibrationReliabilitiesDb.delete()
    res.status(202).json({message: "Vibration MTBF Deleted"})
})

vibrationRouter.delete('/:id/:idHistory/:idData', checkJWT, checkAdminRole, async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const vibrationHistoriesDb = vibrationsDb.collection('history').doc(req.params.idHistory)
    const vibrationHistoryDatasDb = vibrationHistoriesDb.collection('data').doc(req.params.idData)

    await vibrationHistoryDatasDb.delete()
    res.status(202).json({message: "Vibration History Data Deleted"})
})

module.exports = vibrationRouter