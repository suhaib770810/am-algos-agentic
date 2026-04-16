/**
 * Orchestrates fetching new trade data from DS, processing via LIFO matching, and database updates.
 * Handles the running synchronization logic and checks position fidelity.
 * 
 * Dependencies:
 * - Internal dependencies: ../dataFromDS/dataFromDS.js, ../../modules_com/db/dbQueries.js, ./lifo-dbTimeStampQueries.js, ./lifo-match.js, ./lifo-FidelityChecker.js
 * - External dependencies: None
 */

import dataFromDS from '../dataFromDS/dataFromDS.js';
import dbQueries from '../../modules_com/db/dbQueries.js'

import lifoDbTimeStampQueries from './lifo-dbTimeStampQueries.js'
import lotsLifo from "./lifo-match.js";
import positionFidelityChecker from './lifo-FidelityChecker.js';

const dataUpdater = {
    newData: async (db, timestamp) => {
        try {
        // get new trades
        const newTrades = await dataFromDS.getNewTradesData(timestamp.timestamp);
        if (typeof newTrades === 'string') {
          const openPositions = await dbQueries.pullAll(db, 'openPositions')
          return openPositions
        }
        console.log(`new trades: ${newTrades.length}`)
  
        // process new trades
        await lotsLifo.lotsLIFO_db(newTrades, db, 'openPositions', 'closedPositions')
        console.log('new trades processed successfully\n')
  
        // update timestamp
        await lifoDbTimeStampQueries.insertTimestamp(db, 'timeStamps', newTrades[newTrades.length - 1])
        console.log('timestamp updated successfully\n')
  
        // get updated open positions
        const openPositions = await dbQueries.pullAll(db, 'openPositions')
        console.log(`open positions: ${openPositions.length}`)
        return openPositions
      } catch (error) {
        console.log(`Error in updating lot data: ${error.message}`)
        return error.message
      }
    },

    pullAllData: async (db) => {
        try {
            const trades = await dataFromDS.getTradesOnly(process.env.DS_URL)
            if (typeof trades === 'string') {
                console.log('no trades found')
                return trades
            }
            console.log(`trades: ${trades.length}`)
            await lotsLifo.lotsLIFO_db(trades, db, 'openPositions', 'closedPositions')
            console.log('new trades processed successfully\n')
            await lifoDbTimeStampQueries.insertTimestamp(db, 'timeStamps', trades[trades.length - 1])
            console.log('timestamp updated successfully\n')
            const openPositions = await dbQueries.pullAll(db, 'openPositions')
            console.log(`open positions: ${openPositions.length}`)
            return openPositions
        } catch (error) {
            console.log(`Error in updating lot data: ${error.message}`)
            return error.message
        }
    }, 

    run: async (db, realPositions) => {
        try {
            let openPositions
            const timestamp = await lifoDbTimeStampQueries.getLastTimestamp(db, 'timeStamps');
            if (timestamp === undefined) {
                console.log('no timestamp found')
                // confirm that open and closed positions tables are also empty
                openPositions = await dbQueries.pullAll(db, 'openPositions')
                const closedPositions = await dbQueries.pullAll(db, 'closedPositions')
                if (openPositions.length === 0 && closedPositions.length === 0) {
                    console.log('no open or closed positions found, all the data from DS will be pulled')
                }
                openPositions = await dataUpdater.pullAllData(db)
            } else {
                console.log(`last timestamp: ${timestamp.timestamp}`)
                openPositions = await dataUpdater.newData(db, timestamp)
            }


            // fidelity check
            let fidelityCheck = await positionFidelityChecker.positionFidelityCheck(realPositions, openPositions)
            console.log(fidelityCheck.message)
            if (fidelityCheck.errors.length > 0) {
                console.log(fidelityCheck.errors)
            }

            // return open positions
            return openPositions
            
        } catch (error) {
            console.log(`Error in running data updater: ${error.message}`)
            return error.message
        }
    }
}

export default dataUpdater