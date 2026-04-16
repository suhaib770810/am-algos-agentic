/**
 * Fetches data (positions and trades) from a data source API.
 * It provides methods to get all data, specific data, or new trades based on timestamps.
 * 
 * Dependencies:
 * - Internal dependencies: None
 * - External dependencies: node-fetch
 */
import fetch from 'node-fetch';

const dataFromDS = {
    async getAllData (localHostURL = process.env.DS_URL, routes = {positions: 'positions', trades: 'trades'}) {
        try {
            let positionsReq = await fetch(`${localHostURL}/${routes.positions}`)
            let tradesReq = await fetch(`${localHostURL}/${routes.trades}`)
            let positions = await positionsReq.json()
            let trades = await tradesReq.json()
            console.log ('data for positions and trades loaded successfully')
            return {
                positions: positions,
                trades: trades
            }
        } catch (error) {
            console.log(`Error fetching data from DS: ${error.message}`)
            return error.message
        }
    },

    async getTradesOnly (localHostURL = process.env.DS_URL, route = 'trades') {
        try {
            let tradesReq = await fetch(`${localHostURL}/${route}`)
            let trades = await tradesReq.json()
            console.log ('data for trades loaded successfully')
            return trades
        } catch (error) {
            console.log(`Error fetching data from DS: ${error.message}`)
            return error.message
        }
    },

    async getPositionsOnly (localHostURL = process.env.DS_URL, route = 'positions') {
        try {
            let positionsReq = await fetch(`${localHostURL}/${route}`)
            let positions = await positionsReq.json()
            console.log ('data for positions loaded successfully')
            return positions
        } catch (error) {
            console.log(`Error fetching data from DS: ${error.message}`)
            return error.message
        }
    },

    async getNewTradesData (timestamp, localHostURL = process.env.DS_URL ,route = 'tradesNew') {
        try {
            let tradesReq = await fetch(`${localHostURL}/${route}?timestamp=${timestamp}`)
            let tradesReqStatus = tradesReq.status
            if (tradesReqStatus !== 200) {
                let errorText = await tradesReq.text()
                console.log(`Response from DS: ${errorText}`)
                return errorText
            }
            let trades = await tradesReq.json()
            console.log (`new data after ${Date.toLocaleString(new Date(timestamp))} loaded successfully`)
            return trades
        } catch (error) {
            console.log(`Error fetching data from DS: ${error.message}`)
            return error.message
        }
    },
}

export default dataFromDS;
