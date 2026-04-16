/**
 * Queries the database to retrieve information about open LIFO positions.
 * It returns grouped data such as last trade dates and prices for recommendations.
 * 
 * Dependencies:
 * - Internal dependencies: None
 * - External dependencies: None
 */
const lifoRecommendations = {
    lastTrades: async function (db, openPositionsTable) {
        // sql query to select the most recent row for each unique contractDescCustom
        const selectOpenPositionsQuery = `
        SELECT * FROM ${openPositionsTable} t1
        WHERE buyDateTime = (
            SELECT MAX(buyDateTime) 
            FROM ${openPositionsTable} t2 
            WHERE t2.contractDescCustom = t1.contractDescCustom
        )
        GROUP BY contractDescCustom
        ORDER BY underlyingSymbol ASC;
        `;

        const openPositions = await db.all(selectOpenPositionsQuery);
        return openPositions;
    }, 

    lastPrices: async function (db, openPositionsTable) {
        const selectOpenPositionsQuery = `
        SELECT contractDescCustom, MAX(buyDateTime), buyPrice
        FROM ${openPositionsTable} 
        GROUP BY contractDescCustom
        ORDER BY underlyingSymbol ASC;
        `;
        const openPositions = await db.all(selectOpenPositionsQuery);
        return openPositions;
    }, 

    lastPricesWithoutDates: async function (db, openPositionsTable) {
        const selectOpenPositionsQuery = `
        SELECT contractDescCustom, buyPrice 
        FROM ${openPositionsTable} t1
        WHERE buyDateTime = (
            SELECT MAX(buyDateTime) 
            FROM ${openPositionsTable} t2 
            WHERE t2.contractDescCustom = t1.contractDescCustom
        )
        ORDER BY underlyingSymbol ASC;
        `;
        const openPositions = await db.all(selectOpenPositionsQuery);
        return openPositions;
    },

    lastPricesObject: async function (db, openPositionsTable) {
        const selectOpenPositionsQuery = `
        SELECT json_group_object(contractDescCustom, buyPrice) as pricesObject
        FROM (
            SELECT DISTINCT contractDescCustom, buyPrice
            FROM ${openPositionsTable} t1
            WHERE buyDateTime = (
                SELECT MAX(buyDateTime) 
                FROM ${openPositionsTable} t2 
                WHERE t2.contractDescCustom = t1.contractDescCustom
            )
        )`;
        const result = await db.get(selectOpenPositionsQuery);
        return JSON.parse(result.pricesObject);
    }, 

    allOpenPositionsForEachSymbol: async function (db, openPositionsTable) {
        // SQL query to select all open positions for each unique contractDescCustom, and group them into a JSON array
        // get expiry, buyDateTime in time format, and buyPrice as a number for each position
        const selectOpenPositionsQuery = `
        SELECT contractDescCustom, json_group_array(json_object('underlyingSymbol', underlyingSymbol, 'strike', strike, 'expiry', expiry, 'quantity', quantity, 'buyDateTime', buyDateTime, 'buyPrice', buyPrice)) as allOpenPositions
        FROM ${openPositionsTable}
        GROUP BY contractDescCustom
        ORDER BY contractDescCustom ASC;
        `;
        const openPositions = await db.all(selectOpenPositionsQuery);
        // Convert into an object with contractDescCustom as key and allOpenPositions as value, and parse the JSON string in allOpenPositions into a JavaScript object

        let openPosSimpleObject = openPositions.reduce((acc, position) => {
            acc[position.contractDescCustom] = JSON.parse(position.allOpenPositions);
            return acc;
        }, {});
        return openPosSimpleObject;
    },


    // This function retrieves all open positions as an array of objects, where each object represents a position with its details.
    // It doesnt use the JSON functions in SQL, but instead retrieves the raw data and processes it in JavaScript to group by contractDescCustom.

    allOpenPositionsAsArray: async function (db, openPositionsTable) {
        const selectOpenPositionsQuery = `
        SELECT contractDescCustom, underlyingSymbol, strike, expiry, quantity, buyDateTime, buyPrice
        FROM ${openPositionsTable}
        ORDER BY contractDescCustom ASC, buyDateTime DESC;
        `;
        const rows = await db.all(selectOpenPositionsQuery);

        // Group rows by contractDescCustom into an array of objects
        const groupedPositions = rows.reduce((acc, row) => {
            if (!acc[row.contractDescCustom]) {
                acc[row.contractDescCustom] = [];
            }
            acc[row.contractDescCustom].push({
                underlyingSymbol: row.underlyingSymbol,
                strike: row.strike,
                expiry: row.expiry,
                quantity: row.quantity,
                buyDateTime: row.buyDateTime,
                buyPrice: row.buyPrice
            });
            return acc;
        }, {}); 
        return groupedPositions;
    },

}

export default lifoRecommendations;