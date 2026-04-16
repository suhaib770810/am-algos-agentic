/**
 * Compares real position counts versus LIFO-calculated position counts.
 * It is used to verify data fidelity and log any discrepancies.
 * 
 * Dependencies:
 * - Internal dependencies: None
 * - External dependencies: None
 */
const positionFidelityChecker = {
    realPositionCount: (realPositions) => {
        // convert realPositions array to an object with count of each position
        let realPositionCount = realPositions.reduce((acc, pos) => {
            acc[pos.contractDescCustom] = pos.position;
            return acc;
        }, {});
        return realPositionCount;
    }, 

    lifoPositionCount: (lifoPositions) => {
        // convert lifoPositions array to an object with count of each position
        let lifoPositionCount = lifoPositions.reduce((acc, pos) => {
            acc[pos.contractDescCustom] = (acc[pos.contractDescCustom] || 0) + pos.quantity;
            return acc;
        }, {});
        return lifoPositionCount;
    }, 

    positionFidelityCheck: (realPositions, lifoPositions) => {
        let realPositionCount = positionFidelityChecker.realPositionCount(realPositions);
        let lifoPositionCount = positionFidelityChecker.lifoPositionCount(lifoPositions);
        let errors = [];
        let realPositionCountKeys = Object.keys(realPositionCount);
        let lifoPositionCountKeys = Object.keys(lifoPositionCount); 
        let combinedKeys = [...new Set([...realPositionCountKeys, ...lifoPositionCountKeys])];
        for (let i = 0; i < combinedKeys.length; i++) {
            if (realPositionCount[combinedKeys[i]] !== lifoPositionCount[combinedKeys[i]]) {
                errors.push(`Position fidelity check failed for ${combinedKeys[i]} realPositionCount: ${realPositionCount[combinedKeys[i]]}\n lifoPositionCount: ${lifoPositionCount[combinedKeys[i]]}\n`);
            }
        }
        let message
        if (errors.length > 0) {
            message = 'Position fidelity check failed\n\n';
        } else {
            message = 'Position fidelity check passed\n\n';
        }
        return {
            realPositionCount,
            lifoPositionCount,
            errors,
            message
        };
    }
}
    
export default positionFidelityChecker;
