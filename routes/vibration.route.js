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
        status: data.status
    }

    const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data').doc(id)
    const response = await vibrationsDb.set(json)
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
    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    const responseVibration = await vibrationsDb.get()

    let vibrations = {
        id: responseVibration.data().id
    }
    
    const vibrationHistoriesDb = vibrationsDb.collection('history')
    const responseVibrationHistories = await vibrationHistoriesDb.get()

    let arrayHistory = []
    let arrayHistoryData = []
    responseVibrationHistories.forEach( async doc => {
        arrayHistory.push(doc.data())
        let lengthArrayHistory = arrayHistory.length
        
        let vibrationHistoryDataDb = vibrationHistoriesDb.doc(doc.data().id).collection('data')
        let responseVibrationHistoryDatas = await vibrationHistoryDataDb.get()

        responseVibrationHistoryDatas.forEach(doc => {
            arrayHistoryData.push(doc.data())
            arrayHistory[lengthArrayHistory-1]['data'] = arrayHistoryData
        })
    })

    vibrationReliabilitiesDb = vibrationsDb.collection('reliability')
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

    vibrations['history'] = arrayHistory
    vibrations['reliability'] = arrayReliability
    vibrations['mtbf'] = arrayMtbf

    res.send({
        vibrations
    })
})

// vibrationRouter.get('/:id/:idHistory', checkJWT, async (req, res) => {
//     const vibrationsDb = db.collection('vibrations').doc(req.params.id)
//     const responsevibration = await vibrationsDb.get()

//     const vibrationHistoriesDb = vibrationsDb.collection('history').doc(req.params.idHistory)
//     const responsevibrationHistory = await vibrationHistoriesDb.get()

//     const vibrationHistoryDatasDb = vibrationHistoriesDb.collection('data')
//     const responsevibrationHistoryData = await vibrationHistoryDatasDb.get()

//     let arrayHistoryData = []
//     responsevibrationHistoryData.forEach(doc => {
//         arrayHistoryData.push(doc.data())
//     })

//     res.send({
//         vibrations: responsevibration.data(),
//         vibrationHistories: responsevibrationHistory.data(),
//         vibrationHistoryData: arrayHistoryData
//     })
// })

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