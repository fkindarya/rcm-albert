const express = require('express')
const flowRouter = express.Router()
const { db } = require('./firebase')

flowRouter.post('/add-data', async(req, res) => {
    const data = await req.body
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        mtbf: data.mtbf,
        reliability: data.reliability
    }
    
    const flowsDb = db.collection('flows').doc(id)
    const response = await flowsDb.set(json)
    res.send(response)
})

flowRouter.post('/:id/add-history', async (req, res) => {
    const data = await req.body
    
    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        name: data.name
    }

    const flowsDb = db.collection('flows').doc(req.params.id).collection('history').doc(id)
    const response = await flowsDb.set(json)
    res.send(response)
})

flowRouter.post('/:id/:idHistory/add-data', async (req, res) => {
    const data = await req.body

    const id = '_' + new Date().getTime()
    const json = {
        id: id,
        duration: data.duration,
        time: data.time,
        status: data.status
    }

    const flowsDb = db.collection('flows').doc(req.params.id).collection('history').doc(req.params.idHistory).collection('data').doc(id)
    const response = await flowsDb.set(json)
    res.send(response)
})

flowRouter.get('/all', async (req, res) => {
    const flowsDb = db.collection('flows')
    const response = await flowsDb.get()

    let dataArray = []
    response.forEach(doc => {
        dataArray.push(doc.data())
    })

    res.send(dataArray)
})

flowRouter.get('/:id', async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const responseFlow = await flowsDb.get()
    
    const flowHistoriesDb = flowsDb.collection('history')
    const responseFlowHistories = await flowHistoriesDb.get()

    let arrayHistory = []
    responseFlowHistories.forEach(doc => {
        arrayHistory.push(doc.data())
    })

    res.send({
        flows: responseFlow.data(),
        flowHistories: arrayHistory
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

flowRouter.get('/:id/:idHistory', async (req, res) => {
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

flowRouter.delete('/:id/:idHistory/:idData', async (req, res) => {
    const flowsDb = db.collection('flows').doc(req.params.id)
    const flowHistoriesDb = flowsDb.collection('history').doc(req.params.idHistory)
    const flowHistoryDatasDb = flowHistoriesDb.collection('data').doc(req.params.idData)

    const response = await flowHistoryDatasDb.delete()
    res.send(response)
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