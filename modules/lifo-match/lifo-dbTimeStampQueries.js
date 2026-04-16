/**
 * Handles SQL queries to retrieve and update processing timestamps in the database.
 * Provides functions to ensure trades are pulled starting from the last known state.
 * 
 * Dependencies:
 * - Internal dependencies: None
 * - External dependencies: None
 */
const lifoDbTimeStampQueries = {
    // returns the current UTC timestamp in seconds
    // copied from my legacy dateHandler
    getCurrentSqlUTCtimestamp: function() {
        const currentUTCtimestamp = Date.now();
        const currentUTCtimestampSQL = currentUTCtimestamp / 1000;
        return currentUTCtimestampSQL;
    },

    async getLastTimestamp(db, tableName) {
        const query = `SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT 1`;
        const result = await db.get(query);
        return result;
    },

    async insertTimestamp(db, tableName, lastTradeObject) {
        const timeOfUpdate = this.getCurrentSqlUTCtimestamp();
        const timestamp = lastTradeObject.dateTime;
        const lastTxId = `${lastTradeObject.underlyingSymbol} ${lastTradeObject.strike} ${lastTradeObject.expiry} ${lastTradeObject.buySell} ${lastTradeObject.dateTime}`;
        const query = `INSERT INTO ${tableName} (timeOfUpdate, timestamp, lastTxId) VALUES (?, ?, ?)`;
        const result = await db.run(query, [timeOfUpdate, timestamp, lastTxId]);
        return result;
    },
}

export default lifoDbTimeStampQueries;

