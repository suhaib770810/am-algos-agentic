/**
 * Analyzes options trades against active positions to calculate cost basis and P&L.
 * Outputs unrealized P&L broken down both per individual position and aggregated by symbol.
 * 
 * Dependencies:
 * - Internal dependencies: None
 * - External dependencies: None
 * 
 * Dependencies used by other files in the module:
 * - Internal dependencies: None
 * - External dependencies: None
 */
const tradesPLAnalysis = {
    activePositionsAnalysis: (positions, trades) => {
        try {

            // organize trades by position contract description
            let organizedTrades = {}
            trades.forEach((trade) => {
                let posContractDesc = trade.contractDescCustom
                if (!organizedTrades[posContractDesc]) {
                    organizedTrades[posContractDesc] = []
                }
                organizedTrades[posContractDesc].push(trade)
            })

            // analyze positions
            let analyzedPositions = []
            positions.forEach((position) => {

                // create row field entries
                let underlyingSymbol = position.underlyingSymbol
                let expiry = Number(position.expiry)
                let strike = Number(position.strike)
                let positionValue = Number(position.positionValue)
                let contractDescCustom = position.contractDescCustom
                let filteredTrades = organizedTrades[contractDescCustom]
                let costBasis = -(parseFloat(filteredTrades.reduce((total, trade) => {
                    return total + trade.netCash
                }, 0)).toFixed(2))
                let averageCostBasis = Number(parseFloat(costBasis / position.position).toFixed(2))
                let unrealizedPNL = Number(parseFloat(position.positionValue - costBasis).toFixed(2))
                let unrealizedPNLAverage = Number(parseFloat(unrealizedPNL / position.position).toFixed(2))

                // create the row object
                let analyzedPosition = {
                    underlyingSymbol,
                    expiry,
                    strike,
                    'position': position.position,
                    contractDescCustom,
                    costBasis,
                    averageCostBasis,
                    positionValue,
                    unrealizedPNL,
                    unrealizedPNLAverage,
                }

                // push the row object to the array
                analyzedPositions.push(analyzedPosition)
            })

            // create average PNL object
            let positionsPNLObject = analyzedPositions.reduce((acc, pos) => {
                acc[pos.contractDescCustom] = pos.unrealizedPNL;
                return acc;
            }, {});

            console.log('Positions PNL analysis completed successfully\n')

            return {
                analyzedPositions,
                positionsPNLObject
            }

        } catch (error) {
            console.error(`Error analyzing active positions: ${error}`);
            return ('Error analyzing active positions:' + error.message)
        }
    },

    symbolAnalysis: (positions, trades) => {
        try {

            // get current value for each symbol
            let positionsCurrentValueBySymbol = {}
            positions.forEach((position) => {
                let underlyingSymbol = position.underlyingSymbol
                if (!positionsCurrentValueBySymbol[underlyingSymbol]) {
                    positionsCurrentValueBySymbol[underlyingSymbol] = 0
                }
                positionsCurrentValueBySymbol[underlyingSymbol] += position.positionValue
            })

            // sort through trades and calculte position and net cash for each symbol
            let symbolAnalysis = {}
            trades.forEach((trade) => {
                // add analysis values to the symbolAnalysis object
                let underlyingSymbol = trade.underlyingSymbol
                let quantity = trade.quantity
                if (!symbolAnalysis[underlyingSymbol]) {
                    symbolAnalysis[underlyingSymbol] = {
                        underlyingSymbol,
                        position: 0,
                        netCash: 0,
                    }
                }
                symbolAnalysis[underlyingSymbol].position += quantity
                symbolAnalysis[underlyingSymbol].netCash += trade.netCash

            })

            // calculate cost basis, position value, unrealized PNL, and unrealized PNL average for each symbol
            let symbolsAnalysisArray = Object.values(symbolAnalysis)
            symbolsAnalysisArray.forEach((symbolAnalysisEntry) => {
                symbolAnalysisEntry.netCash = Number(parseFloat(symbolAnalysisEntry.netCash).toFixed(2))
                symbolAnalysisEntry["costBasis"] = -(symbolAnalysisEntry.netCash)
                if (symbolAnalysisEntry.position === 0) {
                    symbolAnalysisEntry["averageCostBasis"] = symbolAnalysisEntry.costBasis
                    symbolAnalysisEntry["positionValue"] = 0
                    symbolAnalysisEntry["unrealizedPNL"] = -symbolAnalysisEntry.costBasis
                    symbolAnalysisEntry["unrealizedPNLAverage"] = -symbolAnalysisEntry.costBasis
                } else {
                    let averageCostBasis = Number(parseFloat(symbolAnalysisEntry.costBasis / symbolAnalysisEntry.position).toFixed(2))
                    symbolAnalysisEntry["averageCostBasis"] = averageCostBasis
                    symbolAnalysisEntry["positionValue"] = positionsCurrentValueBySymbol[symbolAnalysisEntry.underlyingSymbol]
                    symbolAnalysisEntry["unrealizedPNL"] = Number(parseFloat(symbolAnalysisEntry.positionValue - symbolAnalysisEntry.costBasis).toFixed(2))
                    symbolAnalysisEntry["unrealizedPNLAverage"] = Number(parseFloat(symbolAnalysisEntry.unrealizedPNL / symbolAnalysisEntry.position).toFixed(2))
                }
            })

            let symbolsPNLObject = symbolsAnalysisArray.reduce((acc, symbolAnalysisEntry) => {
                acc[symbolAnalysisEntry.underlyingSymbol] = symbolAnalysisEntry.unrealizedPNL;
                return acc;
            }, {});


            // SORT IN ALPHABETICAL ORDER
            symbolsPNLObject = Object.fromEntries(Object.entries(symbolsPNLObject).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));
            console.log('Symbol PNL analysis completed successfully\n')

            return {
                symbolAnalysis: symbolsAnalysisArray,
                symbolsPNLObject
            }

        } catch (error) {
            console.error(`Error analyzing trades by symbol: ${error}`);
            return ('Error analyzing trades by symbol:' + error.message)
        }
    },
    generate: (positions, trades) => {
        try {
            let activePosAnalysis = tradesPLAnalysis.activePositionsAnalysis(positions, trades)
            let symbolAnalysis = tradesPLAnalysis.symbolAnalysis(positions, trades)
            return {
                activePosAnalysis,
                symbolAnalysis
            }
        } catch (error) {
            console.error(`Error generating trades P/L analysis: ${error}`);
            return ('Error generating trades P/L analysis:' + error.message)
        }
    }
}

export default tradesPLAnalysis