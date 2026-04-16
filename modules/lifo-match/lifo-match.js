/**
 * Performs Last-In-First-Out (LIFO) matching on option trades.
 * Updates the database by calculating realized P&L and managing open and closed positions.
 * 
 * Dependencies:
 * - Internal dependencies: None
 * - External dependencies: None
 */
const lotsLifo = {


    lotsLIFO_db: async function (transactions, dbConnection, openPositionsTable, closedTradesTable) {

        for (const tx of transactions) {
            if (tx['contractDescCustom'] === undefined || tx['contractDescCustom'] === null) {
                tx['contractDescCustom'] = `${tx['underlyingSymbol']} ${tx['strike']} ${tx['expiry']}`;
            }
            const contractDescCustom = tx['contractDescCustom'];
            const underlyingSymbol = tx['underlyingSymbol'];
            const expiry = tx['expiry'];
            const strike = tx['strike'];
            const tradePrice = tx['tradePrice'];
            const quantity = tx['quantity'];
            const proceeds = tx['proceeds']
            const ibCommission = tx['ibCommission']
            const netCash = tx['netCash']
            const tradeDate = tx['tradeDate'];
            const dateTime = tx['dateTime'];
            const txId = `${underlyingSymbol} ${strike} ${expiry} ${tx['buySell']} ${dateTime}`;
            const tradeIntegerID = tx['ID'];
            if (tx['buySell'] === 'BUY') {
                // Insert new buy position into the open positions table
                const insertQuery = `
                    INSERT INTO ${openPositionsTable} (
                        underlyingSymbol, 
                        strike, 
                        expiry, 
                        contractDescCustom, 
                        quantity, 
                        buyDate, 
                        buyDateTime, 
                        buyPrice, 
                        buyProceeds, 
                        buyIbCommission, 
                        buyNetCash, 
                        buyTxId, 
                        buyTradeIntegerID
                    ) VALUES (
                        '${underlyingSymbol}', 
                        '${strike}', 
                        '${expiry}', 
                        '${contractDescCustom}', 
                        ${quantity}, 
                        '${tradeDate}', 
                        '${dateTime}', 
                        ${tradePrice}, 
                        ${proceeds}, 
                        ${ibCommission}, 
                        ${netCash}, 
                        '${txId}', 
                        ${tradeIntegerID}
                    );
                `;
                await dbConnection.run(insertQuery);

            } else if (tx['buySell'] === 'SELL') {
                let sellQuantity = -quantity;
                const sellProceeds = proceeds; // Get proceeds from the sell transaction
                const sellIbCommission = ibCommission; // Get commission from the sell transaction
                const sellNetCash = netCash; // Get net cash from the sell transaction
                const sellPrice = tradePrice;
                const sellDate = tradeDate;
                const sellTxId = txId;
                const sellTradeIntegerID = tradeIntegerID;
                const sellDateTime = dateTime; // Get sellDateTime

                // Find open positions for this contract description, ordered by buyDate descending (LIFO)
                const selectOpenPositionsQuery = `
                    SELECT * FROM ${openPositionsTable}
                    WHERE contractDescCustom = '${contractDescCustom}'
                    ORDER BY buyDateTime DESC;
                `;
                const openPositions = await dbConnection.all(selectOpenPositionsQuery);
                for (const openPos of openPositions) {
                    if (sellQuantity <= 0) break; // No more quantity to sell

                    const quantitySoldFromThisLot = Math.min(sellQuantity, openPos.quantity);

                    // Calculate buy price after commission based on the net cash of the original buy trade
                    // This accounts for the commission paid on the buy side, prorated for the quantity sold
                    const buyPriceAfterCommission = (-(openPos.buyNetCash) / openPos.quantity) * quantitySoldFromThisLot;

                    // Use sellNetCash as the base for sell proceeds after commission
                    // This accounts for the commission paid on the sell side, prorated for the quantity sold
                    const sellProceedsAfterCommission = (sellNetCash / (-quantity)) * quantitySoldFromThisLot;

                    // Calculate P&L using the adjusted buy and sell prices
                    const pnl = sellProceedsAfterCommission - buyPriceAfterCommission;

                    const insertClosedTradeQuery = `
                        INSERT INTO ${closedTradesTable} (
                            underlyingSymbol, 
                            strike, 
                            expiry, 
                            contractDescCustom, 
                            quantity, 
                            buyDate, 
                            buyDateTime, 
                            buyPrice, 
                            buyPriceAdjusted, 
                            buyProceeds, 
                            buyProceedsAdjusted, 
                            buyIbCommission, 
                            buyIbCommissionAdjusted, 
                            buyNetCash, 
                            buyNetCashAdjusted, 
                            buyTxId, 
                            buyTradeIntegerID,
                            sellDate, 
                            sellDateTime, 
                            sellPrice, 
                            sellPriceAdjusted, 
                            sellProceeds, 
                            sellProceedsAdjusted, 
                            sellIbCommission, 
                            sellIbCommissionAdjusted, 
                            sellNetCashAdjusted, 
                            sellTxId, 
                            sellTradeIntegerID,
                            pnl
                        ) VALUES (
                            '${underlyingSymbol}', 
                            '${strike}', 
                            '${expiry}', 
                            '${contractDescCustom}', 
                            '${quantitySoldFromThisLot}', 
                            '${openPos.buyDate}', 
                            '${openPos.buyDateTime}', 
                            '${openPos.buyPrice}', 
                            '${(openPos.buyProceeds /(100 * openPos.quantity)) * quantitySoldFromThisLot}', 
                            '${openPos.buyProceeds}', 
                            '${(openPos.buyProceeds / openPos.quantity) * quantitySoldFromThisLot}', 
                            '${openPos.buyIbCommission}', 
                            '${(openPos.buyIbCommission / openPos.quantity) * quantitySoldFromThisLot}', 
                            '${openPos.buyNetCash}', 
                            '${buyPriceAfterCommission}', 
                            '${openPos.buyTxId}', 
                            '${openPos.buyTradeIntegerID}',
                            '${sellDate}', 
                            '${sellDateTime}', 
                            '${sellPrice}', 
                            '${(sellProceeds / (-quantity * 100)) * quantitySoldFromThisLot}', 
                            '${sellProceeds}', 
                            '${(sellProceeds / (-quantity)) * quantitySoldFromThisLot}', 
                            '${sellIbCommission}', 
                            '${(sellIbCommission / (-quantity)) * quantitySoldFromThisLot}', 
                            '${sellProceedsAfterCommission}', 
                            '${sellTxId}', 
                            '${sellTradeIntegerID}',
                            '${pnl}'
                        );
                    `;
                    await dbConnection.run(insertClosedTradeQuery);

                    if (openPos.quantity <= sellQuantity) {
                        // This lot is fully sold
                        const deleteOpenPositionQuery = `
                            DELETE FROM ${openPositionsTable}
                            WHERE buyTradeIntegerID = '${openPos.buyTradeIntegerID}' 
                            AND buyTxId = '${openPos.buyTxId}';
                        `;
                        await dbConnection.run(deleteOpenPositionQuery);
                        sellQuantity -= openPos.quantity;
                    } else {
                        // This lot is partially sold
                        const remainingQuantity = openPos.quantity - quantitySoldFromThisLot; // Use quantitySoldFromThisLot here
                        // Update the remaining quantity and prorate the proceeds, ibCommission, and netCash
                        const remainingProceeds = (openPos.buyProceeds / openPos.quantity) * remainingQuantity;
                        const remainingIbCommission = (openPos.buyIbCommission / openPos.quantity) * remainingQuantity;
                        const remainingNetCash = (openPos.buyNetCash / openPos.quantity) * remainingQuantity;

                        const updateOpenPositionQuery = `
                            UPDATE ${openPositionsTable}
                            SET quantity = ${remainingQuantity}, buyProceeds = ${remainingProceeds}, buyIbCommission = ${remainingIbCommission}, buyNetCash = ${remainingNetCash}
                            WHERE buyTxId = '${openPos.buyTxId}';
                        `;
                        await dbConnection.run(updateOpenPositionQuery);
                        sellQuantity = 0; // All sell quantity matched
                    }
                }

                if (sellQuantity > 0) {
                    // This means you tried to sell more than you had (according to LIFO) - a short sale or data error
                    console.warn(`Warning: Sold ${sellQuantity} more contracts of ${underlyingSymbol} than available in LIFO stack for ${contractDescCustom}.`);
                    // Record as unmatched in closed trades
                    const insertUnmatchedTradeQuery = `
                        INSERT INTO ${closedTradesTable} (
                            underlyingSymbol, 
                            strike, 
                            expiry, 
                            contractDescCustom, 
                            quantity, 
                            buyDate, 
                            buyDateTime, 
                            buyPrice, 
                            buyPriceAdjusted, 
                            buyProceeds, 
                            buyProceedsAdjusted, 
                            buyIbCommission, 
                            buyIbCommissionAdjusted, 
                            buyNetCash, 
                            buyNetCashAdjusted, 
                            buyTxId, 
                            buyTradeIntegerID, 
                            sellDate, 
                            sellDateTime, 
                            sellPrice, 
                            sellPriceAdjusted, 
                            sellProceeds, 
                            sellProceedsAdjusted, 
                            sellIbCommission, 
                            sellIbCommissionAdjusted, 
                            sellNetCashAdjusted, 
                            sellTxId, 
                            sellTradeIntegerID, 
                            pnl
                        ) VALUES (
                            '${underlyingSymbol}', 
                            '${strike}', 
                            '${expiry}', 
                            '${contractDescCustom}', 
                            ${sellQuantity}, 
                            NULL, 
                            NULL, 
                            NULL, 
                            NULL, 
                            NULL, 
                            NULL, 
                            NULL, 
                            NULL, 
                            NULL, 
                            NULL, 
                            NULL, 
                            NULL, 
                            '${sellDate}', 
                            '${sellDateTime}', 
                            ${sellPrice}, 
                            ${sellPrice}, 
                            ${sellProceeds}, 
                            ${sellProceeds}, 
                            ${sellIbCommission}, 
                            ${sellIbCommission}, 
                            ${sellNetCash}, 
                            '${sellTxId}', 
                            '${sellTradeIntegerID}', 
                            'Unmatched short sale or data error'
                        );
                    `;
                    await dbConnection.run(insertUnmatchedTradeQuery);
                }
            }
        }
        // No return value needed as database is updated directly
    }
}

export default lotsLifo;
