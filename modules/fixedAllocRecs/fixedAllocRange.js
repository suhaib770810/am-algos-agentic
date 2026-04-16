/**
 * Processes positions to generate allocation recommendations based on a floor and ceiling allocation range.
 * Calculates buy, sell, or hold actions and next recommendation thresholds based on the designated range.
 * 
 * Dependencies:
 * - Internal dependencies: None
 * - External dependencies: None
 */
const fixedAllocRecs = {
    /**
     * Processes each position to generate allocation recommendations based on a floor and ceiling allocation range.
     * Instead of a single fixed allocation amount, it considers a range for the desired position value.
     *
     * @param {object} positionRow - The current position data, including underlyingSymbol, description, positionValue, position.
     * @param {number} allocationFloor - The minimum desired allocation value for the position.
     * @param {number} allocationCeiling - The maximum desired allocation value for the position.
     * @returns {object|null} An object containing recommendation details for the position, or null if an error occurs.
     */
    processEachPosition: (positionRow, allocationFloor, allocationCeiling) => {
        try {
            // Extract relevant data from the position row and convert to numbers.
            let underlyingSymbol = positionRow.underlyingSymbol;
            let description = positionRow.description;
            let positionValue = Number(positionRow.positionValue);
            let position = Number(positionRow.position);
            // Calculate the average value per contract for the current position.
            let averagePositionValue = Number((positionValue / position).toFixed(2));

            // Calculate the number of contracts that would correspond to the allocation floor.
            // This serves as the primary target for 'buy' recommendations and for subsequent threshold calculations.
            // Ensures at least 1 contract if allocationFloor is positive.
            let targetNumberOfContractsForFloor = Math.max(Math.floor(allocationFloor / averagePositionValue), 1);
            // Calculate the number of contracts that would correspond to the allocation ceiling.
            // This serves as the primary target for 'sell' recommendations.
            // Ensures at least 1 contract if allocationCeiling is positive.
            let targetNumberOfContractsForCeiling = Math.max(Math.floor(allocationCeiling / averagePositionValue), 1);

            // Initialize variables for the current recommendation.
            let recNumber; // Number of contracts to buy/sell.
            let recAtCurrentPrice; // 'Buy', 'Sell', or 'Hold'.
            let recAtCurrentPriceStatement; // Detailed recommendation statement.
            let targetNumberOfContracts; // This will represent the target based on the allocation floor.

            // Determine the current recommendation based on whether the position value
            // is below the floor, above the ceiling, or within the desired range.
            if (position < targetNumberOfContractsForFloor) {
                // If current position value is below the allocation floor, recommend buying to reach the floor.
                targetNumberOfContracts = targetNumberOfContractsForFloor;
                recNumber = targetNumberOfContractsForFloor - position;
                recAtCurrentPrice = `Buy`;
                recAtCurrentPriceStatement = `Buy ${recNumber}`;
            } else if (position > targetNumberOfContractsForCeiling) {
                targetNumberOfContracts = targetNumberOfContractsForCeiling;
                // If current position value is above the allocation ceiling, recommend selling to reduce to the ceiling.
                recNumber = targetNumberOfContractsForCeiling - position; // This will be a negative number for selling.
                recAtCurrentPrice = `Sell`;
                recAtCurrentPriceStatement = `Sell ${Math.abs(recNumber)}`;
            } else {
                targetNumberOfContracts = position;
                // If current position value is within the allocation range, recommend holding.
                recNumber = 0;
                recAtCurrentPrice = 'Hold';
                recAtCurrentPriceStatement = 'Hold; No Action';
            }

            // For the purpose of 'next recommendation' thresholds, we use the target for the floor
            // as the primary reference. This maintains consistency with the original logic's intent
            // of a single 'target' to move towards for price-based recommendations.


            // Calculate next recommendation details. These thresholds indicate prices at which
            // the position would cross the next contract boundary relative to the 'targetNumberOfContracts'
            // (which is based on the allocation floor).
            // Threshold to sell: Price at which reducing one contract would bring the value below the target.
            let thresholdSellPrice = Number(targetNumberOfContracts === 1 ? allocationCeiling : (allocationCeiling / (targetNumberOfContracts - 1)).toFixed(2));
            // Threshold to buy: Price at which adding one contract would bring the value above the target.
            let thresholdBuyPrice = Number((allocationFloor / (targetNumberOfContracts + 1)).toFixed(2));
            // Calculate percentage difference from current average position value to the sell threshold.
            let diffFromThresholdSell = Number((((thresholdSellPrice - averagePositionValue) / averagePositionValue) * 100).toFixed(2));
            // Calculate percentage difference from current average position value to the buy threshold.
            let diffFromThresholdBuy = Number((((averagePositionValue - thresholdBuyPrice) / averagePositionValue) * 100).toFixed(2));
            // Determine the statement for the next recommendation (buy if closer to buy threshold, sell if closer to sell threshold).
            let nextRecommendationStatement = diffFromThresholdBuy < diffFromThresholdSell ? `Buy at $${thresholdBuyPrice} (↓ ${diffFromThresholdBuy}%)` : `Sell at $${thresholdSellPrice} (↑ ${diffFromThresholdSell}%)`;

            // Return a structured object containing all calculated recommendation details.
            return {
                underlyingSymbol,
                description,
                position,
                positionValue,
                averagePositionValue,
                currentRecommendation: {
                    targetNumberOfContracts, // This represents the target based on the allocation floor.
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
            // Log any errors encountered during processing a position.
            console.error('Error processing position for fixed allocation recommendation:', error);
            return null;
        }
    },

    /**
     * Generates a comprehensive object of allocation recommendations for an array of positions,
     * using a specified allocation floor and ceiling.
     *
     * @param {Array<object>} positionsArray - An array of position objects to process.
     * @param {number} allocationFloor - The minimum desired allocation value for each position.
     * @param {number} allocationCeiling - The maximum desired allocation value for each position.
     * @returns {object} An object where keys are unique position identifiers and values are their recommendations.
     */
    generate: (positionsArray, allocationFloor, allocationCeiling) => {
        try {
            // Use reduce to iterate through each position and create an object with recommendations.
            let recommendations = positionsArray.reduce((acc, row) => {
                // The key for each recommendation is a combination of symbol, strike, and expiry for uniqueness.
                acc[row.contractDescCustom] = fixedAllocRecs.processEachPosition(row, allocationFloor, allocationCeiling);
                return acc;
            }, {});

            // Log successful generation of recommendations.
            console.log('Fixed allocation recommendations generated successfully with range-based allocation\n');

            // sort alphabetically
            let sortedRecommendations = Object.keys(recommendations).sort().reduce((acc, key) => {
                acc[key] = recommendations[key];
                return acc;
            }, {});

            return sortedRecommendations;
        } catch (error) {
            // Log any errors encountered during the overall recommendation generation process.
            console.error('Error generating fixed allocation recommendations:', error);
            return [];
        }
    }
}

export default fixedAllocRecs;
