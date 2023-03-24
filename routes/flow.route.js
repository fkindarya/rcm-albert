const express = require('express')
const flowRouter = express.Router()

const { checkJWT, checkAdminRole } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')

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

flowRouter.patch('/:id/update-value', checkJWT, checkAdminRole, async (req, res) => {
    const data = await req.body

    const flowsDb = db.collection('flows').doc(req.params.id)
    await flowsDb.update({
        value: data.value
    })

    res.status(201).json({
        message: "Flow Sensor Value Updated to " + data.value
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

    const flowsDb = db.collection('flows').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data')
    const checkData = await flowsDb.get()

    if (checkData.empty){
        const json = {
            id: id,
            status: data.status,
            timeStart: time,
            dateStart: date,
            duration: null,
            timeEnd: null,
            dateEnd: null,
            historyId: req.params.idHistory
        }

        await flowsDb.doc(id).set(json)
        res.status(201).json({message: "Flow History Data Created"})
    } else {
        const historyDatas = await flowsDb.orderBy('dateStart').get()
        let arrayData = []
        historyDatas.forEach(doc => {
            arrayData.push(doc.data())
        })
        
        const lastData = arrayData[arrayData.length - 1]
        let durationBetween = (time - lastData.timeStart) / 1000
        durationBetween /= (60)
        durationBetween = Math.abs(Math.round(durationBetween))
        const updateJson = {
            duration: durationBetween,
            timeEnd: time,
            dateEnd: date
        }

        await flowsDb.doc(lastData.id).update(updateJson)

        const json = {
            id: id,
            status: data.status,
            timeStart: time,
            dateStart: date,
            duration: null,
            timeEnd: null,
            dateEnd: null,
            historyId: req.params.idHistory
        }

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

    let flows = {
        id: responseFlow.data().id
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
        let getHistoryDatas = await db.collection('flows').doc(id).collection('history').doc(doc.id).collection('data').get()

        getHistoryDatas.forEach(doc => {
            if (arrayHistory[index].id == doc.data().historyId){
                arrayHistoryData.push(doc.data())
                arrayHistoryDuration.push(doc.data().duration)
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

    arrayHistoryDuration.forEach( data => {
        tempSumMtbf += data
    })

    mtbf = tempSumMtbf / arrayHistoryDuration.length
    reliability = 1 / (Math.pow(2.72, (12 / mtbf))).toFixed(1)

    flows['mtbf'] = mtbf
    flows['reliability'] = reliability

    res.send({
        flows
    })
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