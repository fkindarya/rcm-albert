const express = require('express')
const flowRouter = express.Router()

const { checkJWT, checkFlowOwnership } = require('../middlewares/auth.middleware')
const { db } = require('./firebase')

flowRouter.post('/add-data', checkJWT, async(req, res) => {
    const data = await req.body
    const verified = await req.verified
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        mtbf: data.mtbf,
        // reliability: data.reliability,
        userId: verified.id
    }
    
    const flowsDb = db.collection('flows').doc(id)
    await flowsDb.set(json)
    res.status(201).json({
        message: "Flow Sensor Created"
    })
})

flowRouter.post('/:id/add-history', checkJWT, checkFlowOwnership, async (req, res) => {
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

flowRouter.post('/:id/add-reliability', checkJWT, checkFlowOwnership, async (req, res) => {
    const data = await req.body

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        value: data.value,
        createdAt: new Date()
    }

    const flowsDb = db.collection('flows').doc(req.params.id).collection('reliability').doc(id)
    await flowsDb.set(json)
    res.status(201).json({message: "Flow Reliability Created"})
})

flowRouter.post('/:id/:idHistory/add-data', checkJWT, checkFlowOwnership, async (req, res) => {
    const data = await req.body

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        duration: data.duration,
        time: data.time,
        status: data.status
    }

    const flowsDb = db.collection('flows').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data').doc(id)
    await flowsDb.set(json)
    res.status(201).json({message: "Flow History Data Created"})
})

flowRouter.get('/all', checkJWT, async (req, res) => {
    const verified = req.verified

    const flowsDb = db.collection('flows')
    const response = await flowsDb.where('userId', '==', verified.id).get()

    let dataArray = []
    response.forEach(doc => {
        dataArray.push(doc.data())
    })

    res.send(dataArray)
})

flowRouter.get('/:id', checkJWT, checkFlowOwnership, async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const responseFlow = await flowsDb.get()
    
    const flowHistoriesDb = flowsDb.collection('history')
    const responseFlowHistories = await flowHistoriesDb.get()

    let arrayHistory = []
    responseFlowHistories.forEach(doc => {
        arrayHistory.push(doc.data())
    })

    flowReliabilitiesDb = flowsDb.collection('reliability')
    const responseFlowReliabilities = await flowReliabilitiesDb.get()

    let arrayReliability = []
    responseFlowReliabilities.forEach(doc => {
        arrayReliability.push(doc.data())
    })

    res.send({
        flows: responseFlow.data(),
        flowHistories: arrayHistory,
        flowReliabilities: arrayReliability
    })

    // res.send(responseFlow.data())
    // const flowsHistoryDb = flowsDb.collection('history')
    // const responseFlowHistory = await flowsHistoryDb.get()
    // let arrayHistory = []
    // responseFlowHistory.forEach(doc => {
    //     arrayHistory.push(doc.data())
    // })

    // let hayuk = Object.assign(responseFlow.data(), arrayHistory)
    // res.send(hayuk)
})

flowRouter.get('/:id/:idHistory', checkJWT, checkFlowOwnership, async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const responseFlow = await flowsDb.get()

    const flowHistoriesDb = flowsDb.collection('history').doc(req.params.idHistory)
    const responseFlowHistory = await flowHistoriesDb.get()

    const flowHistoryDatasDb = flowHistoriesDb.collection('data')
    const responseFlowHistoryData = await flowHistoryDatasDb.get()

    let arrayHistoryData = []
    responseFlowHistoryData.forEach(doc => {
        arrayHistoryData.push(doc.data())
    })

    res.send({
        flows: responseFlow.data(),
        flowHistories: responseFlowHistory.data(),
        flowHistoryData: arrayHistoryData
    })
})

flowRouter.delete('/:id/history/:idHistory', checkJWT, checkFlowOwnership, async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const flowHistoriesDb = flowsDb.collection('history').doc(req.params.idHistory)

    await flowHistoriesDb.delete()
    res.status(202).json({message: "Flow History Deleted"})
})

flowRouter.delete('/:id/reliability/:idReliability', checkJWT, checkFlowOwnership, async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const flowReliabilitiesDb = flowsDb.collection('reliability').doc(req.params.idReliability)

    await flowReliabilitiesDb.delete()
    res.status(202).json({message: "Flow Reliability Deleted"})
})

flowRouter.delete('/:id/:idHistory/:idData', checkJWT, checkFlowOwnership, async (req, res) => {
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