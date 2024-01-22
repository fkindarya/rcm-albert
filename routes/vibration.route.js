const express = require('express')
const vibrationRouter = express.Router()

const { checkJWT, checkAdminRole } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')

const getLimitValue = async (id) => {
    const vibrationsDb = db.collection('vibrations').doc(id)
    const response = await vibrationsDb.get()
    const limitValue = {
        HH: response.data().HH,
        H: response.data().H,
        SP: response.data().SP,
        L: response.data().L,
        LL: response.data().LL
    }
    
    return limitValue
}

const createHistoryData = async (idVibration, idHistory, status) => {
    const date = new Date()
    const time = date.getTime()
    const id = '_' + time

    const vibrationsDb = db.collection('vibrations').doc(idVibration).collection('history').doc(idHistory).collection('data')
    const checkData = await vibrationsDb.get()

    if (checkData.empty){
        const json = {
            id: id,
            status: status,
            timeStart: date,
            timeEnd: null,
            duration: null,
            historyId: idHistory
        }

        await vibrationsDb.doc(id).set(json)
        const message = "Vibration History Data Created"
        return message
    } else {
        const historyDatas = await vibrationsDb.orderBy('timeStart').get()
        let arrayData = []
        historyDatas.forEach(doc => {
            arrayData.push(doc.data())
        })
        
        const lastData = arrayData[arrayData.length - 1]
        let durationBetween = Math.ceil((date.getTime() /1000) - lastData.timeStart._seconds)
        durationBetween = Math.ceil(durationBetween / 60)
        const updateJson = {
            duration: durationBetween,
            timeEnd: date,
        }

        await vibrationsDb.doc(lastData.id).update(updateJson)

        const json = {
            id: id,
            status: status,
            timeStart: date,
            timeEnd: null,
            duration: null,
            historyId: idHistory
        }

        await vibrationsDb.doc(id).set(json)
        const message = "Vibration History Data Created"
        return message
    }
}

const createHistoryValue = async (idVibration, value) => {
    const date = new Date()
    const time = date.getTime()
    const id = '_' + time

    const vibrationsDb = db.collection('vibrations').doc(idVibration).collection('values')

    const json = {
        id: id,
        value: value,
        createdAt: date
    }

    await vibrationsDb.doc(id).set(json)
}

vibrationRouter.post('/add-data', checkJWT, checkAdminRole, async(req, res) => {
    // const data = await req.body
    // const verified = await req.verified
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        HH: null,
        H: null,
        SP: null,
        L: null,
        LL: null,
        value: null,
        vibrationName: null,
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

vibrationRouter.patch('/:id/update-value', async (req, res) => {
    const data = await req.body

    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    await vibrationsDb.update({
        value: data.value
    })

    res.status(201).json({
        message: "Vibration Sensor Value Updated to " + data.value
    })
})

vibrationRouter.patch('/:id/:idHistory/update-vibrationValue', async (req, res) => {
    const data = await req.body
    let response

    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    await vibrationsDb.update({
        value: data.value
    })

    const vibrationLimitValue = await getLimitValue(req.params.id)
    if ((data.value >= vibrationLimitValue.H && data.value <= vibrationLimitValue.HH) || (data.value <= vibrationLimitValue.L && data.value >= vibrationLimitValue.LL)){
        const status = "ERROR"
        response = await createHistoryData(req.params.id, req.params.idHistory, status)
    } else if(data.value > vibrationLimitValue.HH || (data.value < vibrationLimitValue.LL)) {
        const status = "FAILURE"
        response = await createHistoryData(req.params.id, req.params.idHistory, status)
    } else {
        const status = "NORMAL"
        response = await createHistoryData(req.params.id, req.params.idHistory, status)
    }

    createHistoryValue(req.params.id, data.value)

    res.status(201).json({
        message: "Vibration Sensor Value Updated to " + data.value,
        response: response,
    })
})

vibrationRouter.patch('/:id/update-limit-value', checkJWT, checkAdminRole, async (req, res) => {
    const data = await req.body

    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    await vibrationsDb.update({
        HH: data.HH,
        H: data.H,
        SP: data.SP,
        L: data.L,
        LL: data.LL,
    })

    res.status(201).json({
        message: "Vibration Sensor Limit Value Updated"
    })
})

vibrationRouter.patch('/:id/update-vibration-name', checkJWT, async (req, res) => {
    const data = await req.body

    const vibrationsDb = db.collection('vibrations').doc(req.params.id)
    await vibrationsDb.update({
        vibrationName: data.vibrationName
    })

    res.status(201).json({
        message: "Vibration Sensor Name Updated"
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
    const date = new Date()
    const time = date.getTime()
    const id = '_' + time
    
    let dateTimeStart = new Date(data.timeStart)
    let dateTimeEnd = new Date(data.timeEnd)
    let durationBetween = Math.abs(dateTimeStart - dateTimeEnd) / 36e5

    const json = {
        id: id,
        status: data.status,
        timeStart: data.timeStart,
        // duration: data.duration,
        duration: durationBetween,
        timeEnd: data.timeEnd,
        historyId: req.params.idHistory
    }

    if (data.status == "FAILURE") {
        const vibrationsDb = db.collection('vibrations').doc(req.params.id)
        const vibrationHistoriesDb = vibrationsDb.collection('history').doc(req.params.idHistory)
        const vibrationHistoryDatasDb = vibrationHistoriesDb.collection('data')
        const responseVibrationHistoryData = await vibrationHistoryDatasDb.orderBy('timeEnd', 'desc').limit(1).get()

        let lastHistoryData
        responseVibrationHistoryData.forEach(doc => {
            lastHistoryData = doc.data()
        })

        if (lastHistoryData.status == "FAILURE") {
            const lastHistoryDataDb = vibrationHistoryDatasDb.doc(lastHistoryData.id)
            let dateTimeStartLast = new Date(lastHistoryData.timeStart)
            let durationBetweenLast = Math.abs(dateTimeStartLast - dateTimeEnd) / 36e5

            await lastHistoryDataDb.update({
                timeEnd: data.timeEnd,
                duration: durationBetweenLast
            })

            res.status(201).json({
                message: "Vibration Last History Data Updated"
            })
        } else {
            const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data')
            await vibrationsDb.doc(id).set(json)
            res.status(201).json({message: "Vibration History Data Created"})
        }

    } else {
        const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data')
        await vibrationsDb.doc(id).set(json)
        res.status(201).json({message: "Vibration History Data Created"})
    }
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
    let stage = 0
    let failureLoc = 0

    let vibrations = {
        id: responseVibration.data().id,
        vibrationName: responseVibration.data().vibrationName
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
        let arrayHistoryDurationTemp = []
        let getHistoryDatas = await db.collection('vibrations').doc(id).collection('history').doc(doc.id).collection('data').get()

        getHistoryDatas.forEach(doc => {
            if (arrayHistory[index].id == doc.data().historyId){
                arrayHistoryData.push(doc.data())

                if (doc.data().status == "FAILURE"){
                    arrayHistoryDurationTemp.push(doc.data().duration)
                    failureLoc = arrayHistoryDuration.length
                    stage++
                } 
                else {
                    arrayHistoryDuration.push(doc.data().duration)
                }
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

    // arrayHistoryDuration.forEach( data => {
    //     tempSumMtbf += data
    // })

    for (let i = 0; i < failureLoc; i++) {
        tempSumMtbf += arrayHistoryDuration[i]
    }

    // mtbf = tempSumMtbf / arrayHistoryDuration.length
    mtbf = tempSumMtbf / stage
    reliability = 1 / (Math.pow(2.72, (12 / mtbf))).toFixed(1)

    vibrations['mtbf'] = mtbf
    vibrations['reliability'] = reliability

    res.send({
        vibrations
    })
})

vibrationRouter.get('/:id/values', async (req, res) => {
    const vibrationsDb = db.collection('vibrations').doc(req.params.id).collection("values")
    const responseVibrationValues = await vibrationsDb.orderBy('createdAt', 'desc').limit(20).get()

    let arrayValue = []
    responseVibrationValues.forEach(doc => {
        arrayValue.push(doc.data())
    })

    res.send(arrayValue)
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