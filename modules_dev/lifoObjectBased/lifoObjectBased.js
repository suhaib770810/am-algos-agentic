// this function was moved here before being updated.
// all the maths needs to be checked and updated.

const lifoObjectBased = {
    lotsLIFO_unsortedTrades: function (transactions) {
        const openPositionsByContract = {}; // Our LIFO stack for each contractDescCustom
        const closedTradesByContract = {};

        for (const tx of transactions) {
            const contractDescCustom = tx['contractDescCustom'];
            const underlyingSymbol = tx['underlyingSymbol'];
            const expiry = tx['expiry'];
            const strike = tx['strike'];

            if (!openPositionsByContract[contractDescCustom]) {
                openPositionsByContract[contractDescCustom] = [];
                closedTradesByContract[contractDescCustom] = [];
            }

            const openPositions = openPositionsByContract[contractDescCustom];
            const closedTrades = closedTradesByContract[contractDescCustom];

            if (tx['buySell'] === 'BUY') {
                // Add the new lot to our stack of open positions for this contract
                openPositions.push({
                    underlyingSymbol: underlyingSymbol,
                    strike: strike,
                    expiry: expiry,
                    contractDescCustom: contractDescCustom,
                    quantity: tx['quantity'],
                    buyDate: tx['tradeDate'],
                    buyDateTime: tx['dateTime'],
                    buyPrice: tx['tradePrice'],
                    buyProceeds: tx['proceeds'],
                    buyIbCommission: tx['ibCommission'],
                    buyNetCash: tx['netCash'],
                    buyTxId: `${underlyingSymbol} ${strike} ${expiry} ${tx['buySell']} ${tx['dateTime']}`
                });
            } else if (tx['buySell'] === 'SELL') {
                let sellQuantity = -tx['quantity'];
                const sellProceeds = tx['proceeds']; // Get proceeds from the sell transaction
                const sellIbCommission = tx['ibCommission']; // Get commission from the sell transaction
                const sellNetCash = tx['netCash']; // Get net cash from the sell transaction
                const sellPrice = tx['tradePrice'];
                const sellDate = tx['tradeDate'];
                const sellTxId = `${underlyingSymbol} ${strike} ${expiry} ${tx['buySell']} ${tx['dateTime']}`;
                const sellDateTime = tx['dateTime'];

                while (sellQuantity > 0 && openPositions.length > 0) {
                    const lastLot = openPositions[openPositions.length - 1]; // Peek at the top of the stack

                    if (lastLot.quantity <= sellQuantity) {
                        // This lot is fully sold or exactly matches the remaining sell quantity
                        const quantitySoldFromThisLot = lastLot.quantity;

                        // Calculate buy price after commission based on the net cash of the original buy trade
                        // This accounts for the commission paid on the buy side, prorated for the quantity sold
                        const buyPriceAfterCommission = (lastLot.buyNetCash / lastLot.quantity) * quantitySoldFromThisLot;

                        // Use sellNetCash as the base for sell proceeds after commission
                        // This accounts for the commission paid on the sell side, prorated for the quantity sold
                        const sellProceedsAfterCommission = (sellNetCash / (-tx['quantity'])) * quantitySoldFromThisLot;

                        // Calculate P&L using the adjusted buy and sell prices
                        const pnl = sellProceedsAfterCommission - buyPriceAfterCommission;

                        closedTrades.push({
                            underlyingSymbol: underlyingSymbol,
                            strike: strike,
                            expiry: expiry,
                            contractDescCustom: contractDescCustom,
                            quantity: quantitySoldFromThisLot,
                            buyDate: lastLot.buyDate,
                            buyDateTime: lastLot.buyDateTime,
                            buyPrice: lastLot.buyPrice,
                            buyPriceAdjusted: (lastLot.buyPrice / lastLot.quantity) * quantitySoldFromThisLot,
                            buyProceeds: lastLot.buyProceeds,
                            buyProceedsAdjusted: (lastLot.buyProceeds / lastLot.quantity) * quantitySoldFromThisLot,
                            buyIbCommission: lastLot.buyIbCommission,
                            buyIbCommissionAdjusted: (lastLot.buyIbCommission / lastLot.quantity) * quantitySoldFromThisLot,
                            buyNetCash: lastLot.buyNetCash,
                            buyNetCashAdjusted: buyPriceAfterCommission,
                            buyTxId: lastLot.buyTxId,
                            sellDate: sellDate,
                            sellDateTime: sellDateTime,
                            sellPrice: sellPrice,
                            sellPriceAdjusted: (sellPrice / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellProceeds: sellProceeds,
                            sellProceedsAdjusted: (sellProceeds / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellIbCommission: sellIbCommission,
                            sellIbCommissionAdjusted: (sellIbCommission / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellNetCashAdjusted: sellProceedsAfterCommission,
                            sellTxId: sellTxId,
                            pnl: pnl
                        });

                        openPositions.pop(); // Remove the lot from the stack
                        sellQuantity -= quantitySoldFromThisLot;
                    } else {
                        // This lot is partially sold
                        const quantitySoldFromThisLot = sellQuantity;

                        // Calculate buy price after commission based on the net cash of the original buy trade
                        // This accounts for the commission paid on the buy side, prorated for the quantity sold
                        const buyPriceAfterCommission = (lastLot.buyNetCash / lastLot.quantity) * quantitySoldFromThisLot;

                        // Use sellNetCash as the base for sell proceeds after commission
                        // This accounts for the commission paid on the sell side, prorated for the quantity sold
                        const sellProceedsAfterCommission = (sellNetCash / (-tx['quantity'])) * quantitySoldFromThisLot;

                        // Calculate P&L using the adjusted buy and sell prices
                        const pnl = sellProceedsAfterCommission - buyPriceAfterCommission;

                        closedTrades.push({
                            underlyingSymbol: underlyingSymbol,
                            strike: strike,
                            expiry: expiry,
                            contractDescCustom: contractDescCustom,
                            quantity: quantitySoldFromThisLot,
                            buyDate: lastLot.buyDate,
                            buyDateTime: lastLot.buyDateTime,
                            buyPrice: lastLot.buyPrice,
                            buyPriceAdjusted: (lastLot.buyPrice / lastLot.quantity) * quantitySoldFromThisLot,
                            buyProceeds: lastLot.buyProceeds,
                            buyProceedsAdjusted: (lastLot.buyProceeds / lastLot.quantity) * quantitySoldFromThisLot,
                            buyIbCommission: lastLot.buyIbCommission,
                            buyIbCommissionAdjusted: (lastLot.buyIbCommission / lastLot.quantity) * quantitySoldFromThisLot,
                            buyNetCash: lastLot.buyNetCash,
                            buyNetCashAdjusted: buyPriceAfterCommission,
                            buyTxId: lastLot.buyTxId,
                            sellDate: sellDate,
                            sellDateTime: sellDateTime,
                            sellPrice: sellPrice,
                            sellPriceAdjusted: (sellPrice / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellProceeds: sellProceeds,
                            sellProceedsAdjusted: (sellProceeds / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellIbCommission: sellIbCommission,
                            sellIbCommissionAdjusted: (sellIbCommission / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellNetCashAdjusted: sellProceedsAfterCommission,
                            sellTxId: sellTxId,
                            pnl: pnl
                        });

                        lastLot.quantity -= quantitySoldFromThisLot; // Reduce quantity in the lot
                        sellQuantity = 0; // All sold
                    }
                }

                if (sellQuantity > 0) {
                    // This means you tried to sell more than you had (according to LIFO)
                    // Could be a short sale, or an error in transaction data
                    console.warn(`Warning: Sold ${sellQuantity} more contracts of ${underlyingSymbol} than available in LIFO stack for ${contractDescCustom}.`);
                    // You might want to handle this as a short sale if your strategy allows.
                    // For now, we'll just record it as unmatched.
                    closedTrades.push({
                        underlyingSymbol: underlyingSymbol,
                        strike: strike,
                        expiry: expiry,
                        contractDescCustom: contractDescCustom,
                        quantity: sellQuantity,
                        buyDate: null,
                        buyDateTime: null,
                        buyPrice: null,
                        buyPriceAdjusted: null,
                        buyProceeds: null,
                        buyProceedsAdjusted: null,
                        buyIbCommission: null,
                        buyIbCommissionAdjusted: null,
                        buyNetCash: null,
                        buyNetCashAdjusted: null,
                        buyTxId: null,
                        sellDate: sellDate,
                        sellDateTime: sellDateTime,
                        sellPrice: sellPrice,
                        sellPriceAdjusted: sellPrice, // For unmatched, adjusted is the same as original
                        sellProceeds: sellProceeds,
                        sellProceedsAdjusted: sellProceeds, // For unmatched, adjusted is the same as original
                        sellIbCommission: sellIbCommission,
                        sellIbCommissionAdjusted: sellIbCommission, // For unmatched, adjusted is the same as original
                        sellNetCashAdjusted: sellNetCash, // For unmatched, adjusted is the same as original
                        sellTxId: sellTxId,
                        pnl: null,
                        note: "Unmatched short sale or data error"
                    });
                }
            }
        }
        return { openPositionsByContract, closedTradesByContract };
    },

    lotsLIFO_presortedTrades: function (transactions) {
        const openPositions = []; // Our LIFO stack for a specific symbol
        const closedTrades = [];

        for (const tx of transactions) {
            const underlyingSymbol = tx['underlyingSymbol'];
            const strike = tx['strike'];
            const expiry = tx['expiry'];
            const contractDescCustom = tx['contractDescCustom'];

            if (tx['buySell'] === 'BUY') {
                // Add the new lot to our stack of open positions
                openPositions.push({
                    underlyingSymbol: underlyingSymbol,
                    strike: strike,
                    expiry: expiry,
                    contractDescCustom: contractDescCustom,
                    quantity: tx['quantity'],
                    buyDate: tx['tradeDate'],
                    buyDateTime: tx['dateTime'],
                    buyPrice: tx['tradePrice'],
                    buyProceeds: tx['proceeds'],
                    buyIbCommission: tx['ibCommission'],
                    buyNetCash: tx['netCash'],
                    buyTxId: `${underlyingSymbol} ${strike} ${expiry} ${tx['buySell']} ${tx['dateTime']}`
                });
            } else if (tx['buySell'] === 'SELL') {
                let sellQuantity = -tx['quantity'];
                const sellProceeds = tx['proceeds']; // Get proceeds from the sell transaction
                const sellIbCommission = tx['ibCommission']; // Get commission from the sell transaction
                const sellNetCash = tx['netCash']; // Get net cash from the sell transaction
                const sellPrice = tx['tradePrice'];
                const sellDate = tx['tradeDate'];
                const sellTxId = `${underlyingSymbol} ${strike} ${expiry} ${tx['buySell']} ${tx['dateTime']}`;
                const sellDateTime = tx['dateTime'];

                while (sellQuantity > 0 && openPositions.length > 0) {
                    const lastLot = openPositions[openPositions.length - 1]; // Peek at the top of the stack

                    if (lastLot.quantity <= sellQuantity) {
                        // This lot is fully sold or exactly matches the remaining sell quantity
                        const quantitySoldFromThisLot = lastLot.quantity;

                        // Calculate buy price after commission based on the net cash of the original buy trade
                        // This accounts for the commission paid on the buy side, prorated for the quantity sold
                        const buyPriceAfterCommission = (lastLot.buyNetCash / lastLot.quantity) * quantitySoldFromThisLot;

                        // Use sellNetCash as the base for sell proceeds after commission
                        // This accounts for the commission paid on the sell side, prorated for the quantity sold
                        const sellProceedsAfterCommission = (sellNetCash / (-tx['quantity'])) * quantitySoldFromThisLot;

                        // Calculate P&L using the adjusted buy and sell prices
                        const pnl = sellProceedsAfterCommission - buyPriceAfterCommission;

                        closedTrades.push({
                            underlyingSymbol: underlyingSymbol,
                            strike: strike,
                            expiry: expiry,
                            contractDescCustom: contractDescCustom,
                            quantity: quantitySoldFromThisLot,
                            buyDate: lastLot.buyDate,
                            buyDateTime: lastLot.buyDateTime,
                            buyPrice: lastLot.buyPrice,
                            buyPriceAdjusted: (lastLot.buyPrice / lastLot.quantity) * quantitySoldFromThisLot,
                            buyProceeds: lastLot.buyProceeds,
                            buyProceedsAdjusted: (lastLot.buyProceeds / lastLot.quantity) * quantitySoldFromThisLot,
                            buyIbCommission: lastLot.buyIbCommission,
                            buyIbCommissionAdjusted: (lastLot.buyIbCommission / lastLot.quantity) * quantitySoldFromThisLot,
                            buyNetCash: lastLot.buyNetCash,
                            buyNetCashAdjusted: buyPriceAfterCommission,
                            buyTxId: lastLot.buyTxId,
                            sellDate: sellDate,
                            sellDateTime: sellDateTime,
                            sellPrice: sellPrice,
                            sellPriceAdjusted: (sellPrice / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellProceeds: sellProceeds,
                            sellProceedsAdjusted: (sellProceeds / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellIbCommission: sellIbCommission,
                            sellIbCommissionAdjusted: (sellIbCommission / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellNetCashAdjusted: sellProceedsAfterCommission,
                            sellTxId: sellTxId,
                            pnl: pnl
                        });

                        openPositions.pop(); // Remove the lot from the stack
                        sellQuantity -= quantitySoldFromThisLot;
                    } else {
                        // This lot is partially sold
                        const quantitySoldFromThisLot = sellQuantity;

                        // Calculate buy price after commission based on the net cash of the original buy trade
                        // This accounts for the commission paid on the buy side, prorated for the quantity sold
                        const buyPriceAfterCommission = (lastLot.buyNetCash / lastLot.quantity) * quantitySoldFromThisLot;

                        // Use sellNetCash as the base for sell proceeds after commission
                        // This accounts for the commission paid on the sell side, prorated for the quantity sold
                        const sellProceedsAfterCommission = (sellNetCash / (-tx['quantity'])) * quantitySoldFromThisLot;

                        // Calculate P&L using the adjusted buy and sell prices
                        const pnl = sellProceedsAfterCommission - buyPriceAfterCommission;

                        closedTrades.push({
                            underlyingSymbol: underlyingSymbol,
                            strike: strike,
                            expiry: expiry,
                            contractDescCustom: contractDescCustom,
                            quantity: quantitySoldFromThisLot,
                            buyDate: lastLot.buyDate,
                            buyDateTime: lastLot.buyDateTime,
                            buyPrice: lastLot.buyPrice,
                            buyPriceAdjusted: (lastLot.buyPrice / lastLot.quantity) * quantitySoldFromThisLot,
                            buyProceeds: lastLot.buyProceeds,
                            buyProceedsAdjusted: (lastLot.buyProceeds / lastLot.quantity) * quantitySoldFromThisLot,
                            buyIbCommission: lastLot.buyIbCommission,
                            buyIbCommissionAdjusted: (lastLot.buyIbCommission / lastLot.quantity) * quantitySoldFromThisLot,
                            buyNetCash: lastLot.buyNetCash,
                            buyNetCashAdjusted: buyPriceAfterCommission,
                            buyTxId: lastLot.buyTxId,
                            sellDate: sellDate,
                            sellDateTime: sellDateTime,
                            sellPrice: sellPrice,
                            sellPriceAdjusted: (sellPrice / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellProceeds: sellProceeds,
                            sellProceedsAdjusted: (sellProceeds / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellIbCommission: sellIbCommission,
                            sellIbCommissionAdjusted: (sellIbCommission / (-tx['quantity'])) * quantitySoldFromThisLot,
                            sellNetCashAdjusted: sellProceedsAfterCommission,
                            sellTxId: sellTxId,
                            pnl: pnl
                        });

                        lastLot.quantity -= quantitySoldFromThisLot; // Reduce quantity in the lot
                        sellQuantity = 0; // All sold
                    }
                }

                if (sellQuantity > 0) {
                    // This means you tried to sell more than you had (according to LIFO)
                    // Could be a short sale, or an error in transaction data
                    console.warn(`Warning: Sold ${sellQuantity} more contracts of ${underlyingSymbol} than available in LIFO stack for ${contractDescCustom}.`);
                    // Record as unmatched in closed trades
                    closedTrades.push({
                        underlyingSymbol: underlyingSymbol,
                        strike: strike,
                        expiry: expiry,
                        contractDescCustom: contractDescCustom,
                        quantity: sellQuantity,
                        buyDate: null,
                        buyDateTime: null,
                        buyPrice: null,
                        buyPriceAdjusted: null,
                        buyProceeds: null,
                        buyProceedsAdjusted: null,
                        buyIbCommission: null,
                        buyIbCommissionAdjusted: null,
                        buyNetCash: null,
                        buyNetCashAdjusted: null,
                        buyTxId: null,
                        sellDate: sellDate,
                        sellDateTime: sellDateTime,
                        sellPrice: sellPrice,
                        sellPriceAdjusted: sellPrice, // For unmatched, adjusted is the same as original
                        sellProceeds: sellProceeds,
                        sellProceedsAdjusted: sellProceeds, // For unmatched, adjusted is the same as original
                        sellIbCommission: sellIbCommission,
                        sellIbCommissionAdjusted: sellIbCommission, // For unmatched, adjusted is the same as original
                        sellNetCashAdjusted: sellNetCash, // For unmatched, adjusted is the same as original
                        sellTxId: sellTxId,
                        pnl: null,
                        note: "Unmatched short sale or data error"
                    });
                }
            }
        }
        return { openPositions, closedTrades };
    },
}

export default lifoObjectBased;