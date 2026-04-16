import dotenv from 'dotenv'
dotenv.config({ path: './.dotenv/.env' })

if (process.env.NODE_ENV) {
  console.log(`dotenv loaded. NODE_ENV is: ${process.env.NODE_ENV}\n`);
} else {
  console.warn('dotenv loaded, but variables are not visible; check configuration.\n');
}

import path from 'path';
import Database from './modules_com/db/db.js'
const db = await Database.create(path.join(process.env.DB_DIR, process.env.DB_NAME))


// DS route
import dataFromDS from './modules/dataFromDS/dataFromDS.js';

// Algos modules

import lifoMain from './modules/lifo-match/lifo-main.js';
import priceRange from './modules/priceRange/priceRange.js';
import fixedAllocRecs from './modules/fixedAllocRecs/fixedAllocRecs.js';
import fixedAllocRecsRange from './modules/fixedAllocRecs/fixedAllocRange.js';
import fixedAllocRecsRangeNew from './modules/fixedAllocRecs/fixedAllocRangeNew.js';
import tradesPLAnalysis from './modules/tradesPLanalysis/tradesPLanalysis.js';


// Mailgun module
import mailgunClass from './modules_com/mailgun/mailgun.js';
const mailgun = new mailgunClass(process.env.MAILGUN_API_KEY);

// n8n Notion module
import n8nNotionPostRequest from './modules_com/n8nNotion/n8nNotion.js';

// Scheduler module
import weekdayScheduler from './modules_com/Scheduler/scheduler.js';

// Dev modules
import csvEditor from './modules_com/csvEditor/csvEditor.js';
import { json } from 'stream/consumers';



// Function to perform the main analysis
async function algosMain() {
  try {
    // Retrieve data from DS
    let realPositions = await dataFromDS.getPositionsOnly()
    let realTrades = await dataFromDS.getTradesOnly()

    // Update Lifo data
    let lifoData = await lifoMain.generate(db, realPositions);

    // Generate price range recommendations from pre-set delta percentage
    let priceRanges = priceRange.process(lifoData.lastPricesObject, realPositions, process.env.DELTA_PERCENTAGE) // 2 percent price range


    // Generate fixed allocation recommendations from pre-set fixed allocation amount
    let fixedAllocRecommendations = fixedAllocRecs.generate(realPositions, Number(process.env.FIXED_ALLOCATION_AMOUNT))
    let fixedAllocRecommendationsRangeNew = fixedAllocRecsRangeNew.generate(realPositions, Number(process.env.FIXED_ALLOCATION_FLOOR), Number(process.env.FIXED_ALLOCATION_CEILING))


    // Merge price range and fixed allocation recommendations
    // If a contract exists in both, merge the recommendations; if it exists in only one, include that recommendation as is
    // If a contract exists in one but not the other, log a warning
    // Return the merged recommendations object
    const mergeReports = (priceRangeObject, fixedAllocObject) => {
      let mergedReport = {};
      for (let contract in priceRangeObject) {

        // nest recommendation for each contract range in price range under key "priceRangeBasedRecs"
        priceRangeObject[contract] = {
          priceRangeBasedRecs: priceRangeObject[contract]
        }

        if (fixedAllocObject.hasOwnProperty(contract)) {
          mergedReport[contract] = {
            ...fixedAllocObject[contract],
            ...priceRangeObject[contract]
          };
          // mergedReport[contract] = {...fixedAllocObject[contract]['currentRecommendation'], ...fixedAllocObject[contract]['nextRecommendation'], ...priceRangeObject[contract]};

        } else {
          mergedReport[contract] = priceRangeObject[contract];
          console.warn(`Contract ${contract} found in priceRangeObject but not in fixedAllocObject\n`);
        }
      }
      for (let contract in fixedAllocObject) {
        if (!priceRangeObject.hasOwnProperty(contract)) {
          mergedReport[contract] = fixedAllocObject[contract];
          // mergedReport[contract] = {...fixedAllocObject[contract]['currentRecommendation'], ...fixedAllocObject[contract]['nextRecommendation']};
          console.warn(`Contract ${contract} found in fixedAllocObject but not in priceRangeObject\n`);
        }
      }
      return mergedReport;
    };

    let combinedRecs = mergeReports(priceRanges, fixedAllocRecommendationsRangeNew);


    // trades P/L analysis
    let tradesPLAnalysisResult = tradesPLAnalysis.generate(realPositions, realTrades)
    let positionsPNL = tradesPLAnalysisResult.activePosAnalysis.positionsPNLObject
    let symbolsPNL = tradesPLAnalysisResult.symbolAnalysis.symbolsPNLObject
    let pnlData = { positionsPNL, symbolsPNL }



    // console log the recommendations with depth of 5 to see nested objects
    console.log('Here are the open positions:\n');
    // console.dir(lifoData.allOpenPositionsAsArray, { depth: 7 });
    console.log('Here are the open positions for each symbol:\n');
    // console.dir(lifoData.allOpenPositionsForEachSymbol, { depth: 7 });
    console.log('Here are the recommendations:\n');
    console.dir(combinedRecs, { depth: 7 });
    console.log('Here are the PNL recommendations:\n');
    console.dir(pnlData, { depth: 5 });


    // Export data to CSV for dev use
    if (process.env.CSV_EXPORT === 'TRUE') {
      await csvEditor.objectToCsv(lifoData.lastPricesObject, path.join('./', 'dev_output', `lifo_last_prices_${new Date().toISOString().split('T')[0]}.csv`), 'Lifo Last Prices')
      console.log(`Lifo last prices data written to csv successfully for dev use\n`)

      await csvEditor.objectToCsv(priceRanges, path.join('./', 'dev_output', `price_ranges_${new Date().toISOString().split('T')[0]}.csv`), 'Price Ranges')
      console.log(`Price ranges data written to csv successfully for dev use\n`)

      await csvEditor.objectToCsv(fixedAllocRecommendations, path.join('./', 'dev_output', `fixed_alloc_recs_${new Date().toISOString().split('T')[0]}.csv`), 'Fixed Allocation Recommendations')
      console.log(`Fixed allocation recommendations data written to csv successfully for dev use\n`)

      await csvEditor.objectToCsv(combinedRecs, path.join('./', 'dev_output', `combined_recs_${new Date().toISOString().split('T')[0]}.csv`), 'Combined Recommendations')
      console.log(`Combined recommendations data written to csv successfully for dev use\n`)

      await csvEditor.objectToCsv(tradesPLAnalysisResult.activePosAnalysis.positionsPNLObject, path.join('./', 'dev_output', `active_positions_pnl_${new Date().toISOString().split('T')[0]}.csv`), 'Active Positions PnL')
      console.log(`Active positions PnL data written to csv successfully for dev use\n`)

      await csvEditor.objectToCsv(tradesPLAnalysisResult.symbolAnalysis.symbolsPNLObject, path.join('./', 'dev_output', `symbols_pnl_${new Date().toISOString().split('T')[0]}.csv`), 'Symbols PnL')
      console.log(`Symbols PnL data written to csv successfully for dev use\n`);

    }


    // Send data to Notion via n8n webhook
    if (process.env.NOTION_ACTIVE === 'TRUE') {

      // send recommendations and PNL data to Notion via n8n webhook
      await n8nNotionPostRequest(process.env.N8N_NOTION_WEBHOOK, { fixedAllocRecommendations, pnlData })
      console.log('Data sent to Notion via n8n webhook successfully\n')

    } else {
      console.log('Data not sent to Notion; N8N Notion is disabled\n')
    }


    // send data to mailgun for emailing
    if (process.env.MAILGUN_ACTIVE === 'TRUE') {
      // send email
      let recs = [
        'Here are the last prices from lifo recs:',
        lifoData.lastPricesObject,
        'Here are the price ranges',
        priceRanges,
        'Here are the fixed allocation recommendations',
        fixedAllocRecommendations,
        'Here are the combined recommendations',
        combinedRecs,
        'Here is your trades P/L analysis',
        tradesPLAnalysisResult.activePosAnalysis.positionsPNLObject,
        'Here is your symbol P/L analysis',
        tradesPLAnalysisResult.symbolAnalysis.symbolsPNLObject,
      ]

      let combinedRecsHtmlTable = await ejs.renderFile('./modules_com/views/tableMaker/objectToTable.ejs', {
        firstColumnName: 'CustomDescription',
        data: combinedRecs
      })

      let positionsPNLObjectHtmlTable = await ejs.renderFile('./modules_com/views/tableMaker/objectTwoColumns.ejs', {
        column1Name: 'Contract',
        column2Name: 'Total (Unrealized and Realized Pnl)',
        object: tradesPLAnalysisResult.activePosAnalysis.positionsPNLObject
      })

      let symbolsPNLObjectHtmlTable = await ejs.renderFile('./modules_com/views/tableMaker/objectTwoColumns.ejs', {
        column1Name: 'Symbol',
        column2Name: 'Total (Unrealized and Realized Pnl)',
        object: tradesPLAnalysisResult.symbolAnalysis.symbolsPNLObject
      })

      let emailHtml = `<html><body>
        <h1>Combined Recommendations</h1>${combinedRecsHtmlTable}
        <h1>Active Positions PnL</h1>${positionsPNLObjectHtmlTable}
        <h1>Symbols PnL</h1>${symbolsPNLObjectHtmlTable}
        </body></html>`

      await mailgun.sendMessage(process.env.RECIPIENT_EMAIL, 'Recs for MQ - Options', recs, emailHtml);
      console.log('Email sent successfully\n')

    } else {
      console.log('Email not sent; Mail Gun is disabled\n')
    }


  } catch (error) {
    console.error('Error performing analysis:', error);
  }
}


if (process.env.NODE_ENV === 'PROD') {
  console.log('Running in PROD mode\n');

  // Start the scheduling
  weekdayScheduler(algosMain, '8:10');
}

if (process.env.NODE_ENV === 'DEV') {
  const devModule = await import('./sandboxAlgos.js');

  console.log('Running in DEV mode\n');

  weekdayScheduler(algosMain, '8:10');
}



console.log('your main algos file is running');