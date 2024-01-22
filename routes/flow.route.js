const express = require('express')
const flowRouter = express.Router()

const { checkJWT, checkAdminRole } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')

const getLimitValue = async (id) => {
    const flowsDb = db.collection('flows').doc(id)
    const response = await flowsDb.get()
    const limitValue = {
        HH: response.data().HH,
        H: response.data().H,
        SP: response.data().SP,
        L: response.data().L,
        LL: response.data().LL
    }
    
    return limitValue
}

const createHistoryData = async (idFlow, idHistory, status) => {
    const date = new Date()
    const time = date.getTime()
    const id = '_' + time

    const flowsDb = db.collection('flows').doc(idFlow).collection('history').doc(idHistory).collection('data')
    const checkData = await flowsDb.get()

    if (checkData.empty){
        const json = {
            id: id,
            status: status,
            timeStart: date,
            timeEnd: null,
            duration: null,
            historyId: idHistory
        }

        await flowsDb.doc(id).set(json)
        const message = "Flow History Data Created"
        return message
    } else {
        const historyDatas = await flowsDb.orderBy('timeStart').get()
        let arrayData = []
        historyDatas.forEach(doc => {
            arrayData.push(doc.data())
        })
        
        const lastData = arrayData[arrayData.length - 1]
        let durationBetween = Math.ceil((date.getTime() /1000) - lastData.timeStart._seconds)
        durationBetween = Math.ceil(durationBetween / 60)
        const updateJson = {
            duration: durationBetween,
            timeEnd: date
        }

        await flowsDb.doc(lastData.id).update(updateJson)

        const json = {
            id: id,
            status: status,
            timeStart: date,
            timeEnd: null,
            duration: null,
            historyId: idHistory
        }

        await flowsDb.doc(id).set(json)
        const message = "Flow History Data Created"
        return message
    }
}

const createHistoryValue = async (idFlow, value) => {
    const date = new Date()
    const time = date.getTime()
    const id = '_' + time

    const flowsDb = db.collection('flows').doc(idFlow).collection('values')

    const json = {
        id: id,
        value: value,
        createdAt: date
    }

    await flowsDb.doc(id).set(json)
    const message = "Flow Value Data Inserted"
    return message
}

flowRouter.post('/add-data', checkJWT, checkAdminRole, async(req, res) => {
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
        flowName: null,
        // mtbf: data.mtbf,
        // reliability: data.reliability,
        // userId: verified.id
    }
    
    const flowsDb = db.collection('flows').doc(id)
    await flowsDb.set(json)
    res.status(201).json({
        message: "Flow Sensor Created",
        data: id
    })
})

flowRouter.patch('/:id/update-value', async (req, res) => {
    const data = await req.body

    const flowsDb = db.collection('flows').doc(req.params.id)
    await flowsDb.update({
        value: data.value
    })

    res.status(201).json({
        message: "Flow Sensor Value Updated to " + data.value
    })
})

flowRouter.patch('/:id/update-flowValue', async (req, res) => {
    const data = await req.body
    let response

    const flowsDb = db.collection('flows').doc(req.params.id)
    await flowsDb.update({
        value: data.value
    })

    // const flowLimitValue = await getLimitValue(req.params.id)
    // if ((data.value >= flowLimitValue.H && data.value <= flowLimitValue.HH) || (data.value <= flowLimitValue.L && data.value >= flowLimitValue.LL)){
    //     const status = "ERROR"
    //     response = await createHistoryData(req.params.id, req.params.idHistory, status)
    // } else if(data.value > flowLimitValue.HH || (data.value < flowLimitValue.LL)) {
    //     const status = "FAILURE"
    //     response = await createHistoryData(req.params.id, req.params.idHistory, status)
    // } else {
    //     const status = "NORMAL"
    //     response = await createHistoryData(req.params.id, req.params.idHistory, status)
    // }

    response = createHistoryValue(req.params.id, data.value)

    res.status(201).json({
        message: "Flow Sensor Value Updated to " + data.value,
        response: response,
    })
})

flowRouter.patch('/:id/update-limit-value', checkJWT, checkAdminRole, async (req, res) => {
    const data = await req.body

    const flowsDb = db.collection('flows').doc(req.params.id)
    await flowsDb.update({
        HH: data.HH,
        H: data.H,
        SP: data.SP,
        L: data.L,
        LL: data.LL,
    })

    res.status(201).json({
        message: "Flow Sensor Limit Value Updated"
    })
})

flowRouter.patch('/:id/update-flow-name', checkJWT, async (req, res) => {
    const data = await req.body

    const flowsDb = db.collection('flows').doc(req.params.id)
    await flowsDb.update({
        flowName: data.flowName
    })

    res.status(201).json({
        message: "Flow Sensor Name Updated"
    })
})

flowRouter.post('/:id/add-history', checkJWT, checkAdminRole, async (req, res) => {
    const data = await req.body
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        name: data.name
    }

    const flowsDb = db.collection('flows').doc(req.params.id).collection('history').doc(id)
    await flowsDb.set(json)
    res.status(201).json({message: "Flow History Created"})
})

flowRouter.post('/:id/add-reliability', checkJWT, checkAdminRole, async (req, res) => {
    const data = await req.body

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        reliability: data.value,
        createdAt: new Date()
    }

    const flowsDb = db.collection('flows').doc(req.params.id).collection('reliability').doc(id)
    await flowsDb.set(json)
    res.status(201).json({message: "Flow Reliability Created"})
})

flowRouter.post('/:id/add-mtbf', checkJWT, checkAdminRole, async (req, res) => {
    const data = await req.body

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        mtbf: data.value,
        createdAt: new Date()
    }

    const flowsDb = db.collection('flows').doc(req.params.id).collection('mtbf').doc(id)
    await flowsDb.set(json)
    res.status(201).json({message: "Flow MTBF Created"})
})

flowRouter.post('/:id/:idHistory/add-data', checkJWT, checkAdminRole, async (req, res) => {
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
        const flowsDb = db.collection('flows').doc(req.params.id)
        const flowHistoriesDb = flowsDb.collection('history').doc(req.params.idHistory)
        const flowHistoryDatasDb = flowHistoriesDb.collection('data')
        const responseFlowHistoryData = await flowHistoryDatasDb.orderBy('timeEnd', 'desc').limit(1).get()

        let lastHistoryData
        responseFlowHistoryData.forEach(doc => {
            lastHistoryData = doc.data()
        })

        if (lastHistoryData.status == "FAILURE"){
            const lastHistoryDataDb = flowHistoryDatasDb.doc(lastHistoryData.id)
            let dateTimeStartLast = new Date(lastHistoryData.timeStart)
            let durationBetweenLast = Math.abs(dateTimeStartLast - dateTimeEnd) / 36e5

            await lastHistoryDataDb.update({
                timeEnd: data.timeEnd,
                duration: durationBetweenLast
            })

            res.status(201).json({
                message: "Flow Last History Data Updated"
            })
        } else {
            const flowsDb = db.collection('flows').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data')
            await flowsDb.doc(id).set(json)
            res.status(201).json({message: "Flow History Data Created"})
        }

    } else {
        const flowsDb = db.collection('flows').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data')
        await flowsDb.doc(id).set(json)
        res.status(201).json({message: "Flow History Data Created"})
    }
})

flowRouter.get('/all', checkJWT, async (req, res) => {
    // const verified = req.verified

    const flowsDb = db.collection('flows')
    const response = await flowsDb.get()
    // const response = await flowsDb.where('userId', '==', verified.id).get()

    let dataArray = []
    response.forEach(doc => {
        dataArray.push(doc.data())
    })

    res.send(dataArray)
})

flowRouter.get('/:id', checkJWT, async (req, res) => {
    const id = req.params.id
    const flowsDb = db.collection('flows').doc(id)
    const responseFlow = await flowsDb.get()
    let stage = 0
    let failureLoc = 0

    let flows = {
        id: responseFlow.data().id,
        flowName: responseFlow.data().flowName
    }
    
    const flowHistoriesDb = flowsDb.collection('history')
    const responseFlowHistories = await flowHistoriesDb.get()

    let arrayHistory = []
    responseFlowHistories.forEach(doc => {
        arrayHistory.push(doc.data())
    })

    flows['history'] = arrayHistory
    let arrayHistoryDuration = []
    
    arrayHistory.forEach( async (doc, index) => {
        let arrayHistoryData = []
        let arrayHistoryDataTemp = []
        let arrayHistoryDurationTemp = []
        let getHistoryDatas = await db.collection('flows').doc(id).collection('history').doc(doc.id).collection('data').get()

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
        
        flows['history'][index].data = arrayHistoryData
    })

    const flowReliabilitiesDb = flowsDb.collection('reliability')
    const responseFlowReliabilities = await flowReliabilitiesDb.get()

    let arrayReliability = []
    responseFlowReliabilities.forEach(doc => {
        arrayReliability.push(doc.data())
    })
    
    const flowMtbfDb = flowsDb.collection('mtbf')
    const responseFlowMtbf = await flowMtbfDb.get()

    let arrayMtbf = []
    responseFlowMtbf.forEach(doc => {
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

    flows['mtbf'] = mtbf
    flows['reliability'] = reliability

    res.send({
        flows
    })
})

flowRouter.get('/:id/values', async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id).collection("values")
    const responseFlowValues = await flowsDb.orderBy('createdAt', 'desc').limit(20).get()

    let arrayValue = []
    responseFlowValues.forEach(doc => {
        arrayValue.push(doc.data())
    })

    res.send(arrayValue)
})

flowRouter.get('/:id/:idHistory', checkJWT, async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const responseFlow = await flowsDb.get()

    let flows = {
        id: responseFlow.data().id
    }

    const flowHistoriesDb = flowsDb.collection('history').doc(req.params.idHistory)
    const responseFlowHistory = await flowHistoriesDb.get()

    let history = {
        id: responseFlowHistory.data().id,
        name: responseFlowHistory.data().name
    }
    
    const flowHistoryDatasDb = flowHistoriesDb.collection('data')
    const responseFlowHistoryData = await flowHistoryDatasDb.get()

    let arrayHistoryData = []
    responseFlowHistoryData.forEach(doc => {
        arrayHistoryData.push(doc.data())
    })

    flows['history'] = history
    flows['history']['data'] = arrayHistoryData

    res.send({
        flows
    })
})

flowRouter.delete('/:id/history/:idHistory', checkJWT, checkAdminRole, async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const flowHistoriesDb = flowsDb.collection('history').doc(req.params.idHistory)

    await flowHistoriesDb.delete()
    res.status(202).json({message: "Flow History Deleted"})
})

flowRouter.delete('/:id/reliability/:idReliability', checkJWT, checkAdminRole, async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const flowReliabilitiesDb = flowsDb.collection('reliability').doc(req.params.idReliability)

    await flowReliabilitiesDb.delete()
    res.status(202).json({message: "Flow Reliability Deleted"})
})

flowRouter.delete('/:id/mtbf/:idMtbf', checkJWT, checkAdminRole, async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const flowMtbfDb = flowsDb.collection('mtbf').doc(req.params.idMtbf)

    await flowMtbfDb.delete()
    res.status(202).json({message: "Flow MTBF Deleted"})
})

flowRouter.delete('/:id/:idHistory/:idData', checkJWT, checkAdminRole, async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const flowHistoriesDb = flowsDb.collection('history').doc(req.params.idHistory)
    const flowHistoryDatasDb = flowHistoriesDb.collection('data').doc(req.params.idData)

    await flowHistoryDatasDb.delete()
    res.status(202).json({message: "Flow History Data Deleted"})
})


// flowRouter.post('/data/:id/history', async (req, res) => {
//     const data = await req.body

//     const id = '_' + new Date().getTime()
//     const json = {
//         id: id,
//         name: data.name,
//         flowId: "/flows/" + req.params.id
//     }

//     const flowsDb = db.collection('flow_histories').doc(id)
//     const response = await flowsDb.set(json)
//     res.send(response)
// })

// flowRouter.post('/data/:idFlow/history/:id', async (req, res) => {
//     const data = await req.body

//     const id = '_' + new Date().getTime()
//     const json = {
//         id: id,
//         duration: data.duration,
//         time: data.time,
//         status: data.status,
//         flowHistoryId: req.params.id,
//         flowId: req.params.idFlow
//     }

//     const flowsDb = db.collection('flow_history_datas').doc(id)
//     const response = await flowsDb.set(json)
//     res.send(response)
// })

// flowRouter.get('/data/:id', async (req, res) => {
//     const { id } = req.params
//     const flowsDb = db.collection('flows').doc(id)
//     const responseFlow = await flowsDb.get()

//     const flowHistoriesDb = db.collection('flow_histories')
//     const responseFlowHistory = await flowHistoriesDb.where('flowId', '==', id).get()
//     let historyArray = []
//     responseFlowHistory.forEach(doc => {
//         historyArray.push(doc.data())
//     })

//     const flowHistoryDataDb = db.collection('flow_history_datas')
//     const responseFlowHistoryData = await flowHistoryDataDb.where('flowId', '==', id).get()
//     let historyDataArray = []
//     responseFlowHistoryData.forEach(doc => {
//         historyDataArray.push(doc.data())
//     })

//     res.send({
//         flow: responseFlow.data(), 
//         flowHistory: historyArray,
//         flowHistoryData: historyDataArray
//     })
// })

module.exports = flowRouter