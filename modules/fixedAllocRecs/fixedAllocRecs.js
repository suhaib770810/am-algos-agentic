/**
 * Processes positions to generate allocation recommendations based on a single fixed allocation amount.
 * Calculates buy, sell, or hold actions along with thresholds for the next recommendation.
 * 
 * Dependencies:
 * - Internal dependencies: None
 * - External dependencies: None
 * 
 * Dependencies used by other files in the module:
 * - Internal dependencies: None
 * - External dependencies: None
 */
const fixedAllocRecs = {
    processEachPosition: (positionRow, allocationAmount) => {
        try {
            let underlyingSymbol = positionRow.underlyingSymbol;
            let description = positionRow.description;
            let positionValue = Number(positionRow.positionValue);
            let position = Number(positionRow.position);
            let averagePositionValue = Number((positionValue / position).toFixed(2));

            // Calculate recommendation at current price
            let targetNumberOfContracts = Math.max(Math.floor(allocationAmount / averagePositionValue), 1);
            let recNumber = targetNumberOfContracts - position;
            let recAtCurrentPrice = recNumber > 0 ? `Buy` : recNumber < 0 ? `Sell` : 'Hold';
            let recAtCurrentPriceStatement = recNumber > 0 ? `Buy ${recNumber}` : recNumber < 0 ? `Sell ${Math.abs(recNumber)}` : 'Hold; No Action';

            // Calculate next recommendation details
            let thresholdSellPrice = Number(targetNumberOfContracts === 1 ? allocationAmount : (allocationAmount / (targetNumberOfContracts - 1)).toFixed(2))
            let thresholdBuyPrice = Number((allocationAmount / (targetNumberOfContracts + 1)).toFixed(2))
            let diffFromThresholdSell = Number((((thresholdSellPrice - averagePositionValue) / averagePositionValue) * 100).toFixed(2))
            let diffFromThresholdBuy = Number((((averagePositionValue - thresholdBuyPrice) / averagePositionValue) * 100).toFixed(2))
            let nextRecommendationStatement = diffFromThresholdBuy < diffFromThresholdSell ? `Buy at $${thresholdBuyPrice} (↓ ${diffFromThresholdBuy}%)` : `Sell at $${thresholdSellPrice} (↑ ${diffFromThresholdSell}%)`

            return {
                underlyingSymbol,
                description,
                position,
                positionValue,
                averagePositionValue,
                currentRecommendation: {
                    allocationAmount,
                    targetNumberOfContracts,
                    recNumber,
                    recAtCurrentPrice,
                    recAtCurrentPriceStatement,
                },
                nextRecommendation: {
                    thresholdBuyPrice,
                    thresholdSellPrice,
                    diffFromThresholdBuy,
                    diffFromThresholdSell,
                    nextRecommendationStatement
                }
            }
        }
        catch (error) {
            console.error('Error processing position for fixed allocation recommendation:', error);
            return null;
        }
    },

    generate: (positionsArray, allocationAmount) => {
        try {
            // create an object with recommendations for each position
            let recommendations = positionsArray.reduce((acc, row) => {
                acc[row.contractDescCustom] = fixedAllocRecs.processEachPosition(row, allocationAmount);
                return acc;
            }, {});

            console.log('Fixed allocation recommendations generated successfully\n');

            // sort alphabetically
            let sortedRecommendations = Object.keys(recommendations).sort().reduce((acc, key) => {
                acc[key] = recommendations[key];
                return acc;
            }, {});

            return sortedRecommendations;
        } catch (error) {
            console.error('Error generating fixed allocation recommendations:', error);
            return [];
        }
    }
}

export default fixedAllocRecs;