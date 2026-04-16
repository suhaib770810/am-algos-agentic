import dotenv from 'dotenv'
dotenv.config({
  path: './.dotenv/.env'
})

// load databases
import path from 'path';
import Database from './modules_com/db/db.js'
const db = await Database.create(path.join(process.env.DB_DIR, process.env.DB_NAME))
import dbQueries from './modules_com/db/dbQueries.js'

// load schema
import schemaObjects from "./schema/schemaObjects.js";


// load dataFromDS and get data
import dataFromDS from './modules/dataFromDS/dataFromDS.js';



// load writeMockDataToFile
import writeMockDataToFile from "./modules_com/mockDataWriter/mockDataWriter.js";

// ======================================================================================================== //

/* CREATE TABLES FOR OPEN AND CLOSED POSITIONS
    const createTables = async () => {
      try {
        await db.createTableSpecificFields('openPositions', schemaObjects.openPositions)
        await db.createTableSpecificFields('closedPositions', schemaObjects.closedPositions)
      } catch (error) {
        console.log(`error in table creation: ${error.message}`)
        return error.message
      }
    }

    // await createTables()
*/

/* UPDATING OPEN AND CLOSED POSITIONS USING THE BULK DATA. 

  const myTester = async () => {
    try{
        console.log(trades[0])
        await lotsLifo.lotsLIFO_db(trades, db, 'openPositions', 'closedPositions')
    }catch (error) {
      console.log(`error in lifo process: ${error.message}`)
      return error.message
    }
  }

  // await myTester()
*/

/* CREATE TIMESTAMP TABLE AND TEST IT
  const createTimestampTable = async () => {
    try {
      await db.createTableSpecificFields('timeStamps', schemaObjects.timeStamp)
    } catch (error) {
      console.log(`error in table creation: ${error.message}`)
      return error.message
    }
  }
  await createTimestampTable()
*/

/* TEST TIMESTAMP WORKFLOW
  const testTimestampWorkflow = async () => {
    try {
      const lastTradeObject = trades[trades.length - 1];
      const result = await dbTimeStampQueries.insertTimestamp(db, 'timeStamps', lastTradeObject);
      console.log(result);
    } catch (error) {
      console.log(`error in timestamp workflow: ${error.message}`);
      return error.message;
    }
  }
  
  
  
  await testTimestampWorkflow()

  */

/* TEST NEW TRADES METHOD

const newTradesTester = async () => {
  try {
    const timestamp = await dbTimeStampQueries.getLastTimestamp(db, 'timeStamps');
    const newTrades = await dataFromDS.getNewTradesData(timestamp.timestamp);
    console.log(newTrades);
  } catch (error) {
    console.log(`error in new trades tester: ${error.message}`);
    return error.message;
  }
}

// await newTradesTester()
*/

/* TEST COMPLETE DATA UPDATER
  const dataUpdater = async () => {
    try {
      // get last timestamp
      const timestamp = await dbTimeStampQueries.getLastTimestamp(db, 'timeStamps');
      console.log(`last timestamp: ${timestamp.timestamp}`)

      // get new trades
      const newTrades = await dataFromDS.getNewTradesData(timestamp.timestamp);
      if (typeof newTrades === 'string') {
        console.log('no new trades found')
        const openPositions = await dbQueries.pullAll(db, 'openPositions')
        return openPositions
      }
      console.log(`new trades: ${newTrades.length}`)

      // process new trades
      await lotsLifo.lotsLIFO_db(newTrades, db, 'openPositions', 'closedPositions')
      console.log('new trades processed successfully\n')

      // update timestamp
      await dbTimeStampQueries.insertTimestamp(db, 'timeStamps', newTrades[newTrades.length - 1])
      console.log('timestamp updated successfully\n')

      // get updated open positions
      const openPositions = await dbQueries.pullAll(db, 'openPositions')
      console.log(`open positions: ${openPositions.length}`)
      return openPositions
    } catch (error) {
      console.log(`Error in updating lot data: ${error.message}`)
      return error.message
    }
  }

  let openPos = await dataUpdater();
*/

/* MANUAL QUERY

// const manualQuery = async () => {
//   try {
//     const query = ''
//     const result = await db.run(query)
//     console.log(result)
//   } catch (error) {
//     console.log(`error in manual query: ${error.message}`)
//     return error.message
//   }
// }
// await manualQuery()

*/

/* TEST NO TIMESTAMP FOUND WORKFLOW
const noTimestampTester = async () => {
  try {
    const timeStampResult = await dbTimeStampQueries.getLastTimestamp(db, 'timeStamps');
    console.log(timeStampResult)
    if (timeStampResult === undefined) {
      console.log('no timestamp found')
      return
    }
    console.log(`last timestamp: ${timeStampResult.timestamp}`)
  } catch (error) {
    console.log(`error in no timestamp tester: ${error.message}`);
    return error.message;
  }
}

await noTimestampTester()

*/


// ======================================================================================================== //

const sandbox = () => {
  console.log('this is a dummy function to make sure the sandbox script is loaded with the program')
}

sandbox()

// import this file in the main file to make sure the functions here are executed. 
export default sandbox;



