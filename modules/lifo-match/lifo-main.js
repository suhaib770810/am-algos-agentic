/**
 * Acts as the main integration point for the LIFO matching module.
 * Orchestrates data updating, LIFO position calculation, and generation of recommendations.
 * 
 * Dependencies:
 * - Internal dependencies: ./lifo-dataUpdater.js, ./lifo-Recommendations.js
 * - External dependencies: None
 * 
 * Dependencies used by other files in the module:
 * - Internal dependencies: ../dataFromDS/dataFromDS.js (lifo-dataUpdater.js), ../../modules_com/db/dbQueries.js (lifo-dataUpdater.js), ./lifo-dbTimeStampQueries.js (lifo-dataUpdater.js), ./lifo-match.js (lifo-dataUpdater.js), ./lifo-FidelityChecker.js (lifo-dataUpdater.js)
 * - External dependencies: None
 */
import dataUpdater from './lifo-dataUpdater.js'
import lifoRecommendations from './lifo-Recommendations.js'

const lifoMain = {
    generate: async (db, realPositions) => {
        const openPositions = await dataUpdater.run(db, realPositions)
        
        // Load lifo symbol wise lifo recommendations
        let lastTrades = await lifoRecommendations.lastTrades(db, 'openPositions')
        let lastPrices = await lifoRecommendations.lastPrices(db, 'openPositions')
        let lastPricesWithoutDates = await lifoRecommendations.lastPricesWithoutDates(db, 'openPositions')
        let lastPricesObject = await lifoRecommendations.lastPricesObject(db, 'openPositions')
        let allOpenPositionsForEachSymbol = await lifoRecommendations.allOpenPositionsForEachSymbol(db, 'openPositions')
        let allOpenPositionsAsArray = await lifoRecommendations.allOpenPositionsAsArray(db, 'openPositions')

        return {
            openPositions,
            lastTrades,
            lastPrices,
            lastPricesWithoutDates,
            lastPricesObject,
            allOpenPositionsForEachSymbol,
            allOpenPositionsAsArray
        }
    }
}

export default lifoMain

