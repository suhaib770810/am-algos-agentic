/**
 * Calculates a target price range around the last available price based on a percentage.
 * Generates buy, sell, or hold recommendations if current values fall outside this calculated range.
 * 
 * Dependencies:
 * - Internal dependencies: None
 * - External dependencies: None
 * 
 * Dependencies used by other files in the module:
 * - Internal dependencies: None
 * - External dependencies: None
 */
const priceRange = {
    range: (midPoint, percentage) => {
        const delta = Number((midPoint * (percentage / 100)).toFixed(2));
        return {
            lastPrice: Number(midPoint.toFixed(2)),
            percentage: `${percentage}%`,
            buyAt: Number((midPoint - delta).toFixed(2)),
            sellAt: Number((midPoint + delta).toFixed(2))
        };
    },

    process: (lastPricesObject, positions, percentage) => {
        let result = {};

        let positionsLabeledbyDesc = positions.reduce((acc, pos) => {
            let desc = pos.contractDescCustom
            acc[desc] = pos;
            return acc;
        }, {})

        for (let contract in lastPricesObject) {
            const lastPrice = lastPricesObject[contract];
            let range = priceRange.range(lastPrice, percentage);
            range['positionValue'] = Number(((positionsLabeledbyDesc[contract].positionValue) / 100).toFixed(2))
            range['position'] = positionsLabeledbyDesc[contract].position
            range['averageCurrentValue'] = Number((range.positionValue / range.position).toFixed(2))
            range['recommendation'] = range.buyAt > range.averageCurrentValue ? 'Buy' : range.sellAt < range.averageCurrentValue ? 'Sell' : 'Hold'
            result[contract] = range;
        }

        // arrange in alphabetical order
        let sortedResult = Object.keys(result).sort().reduce((acc, key) => {
            acc[key] = result[key];
            return acc;
        }, {});

        return sortedResult;
    }
}

export default priceRange;