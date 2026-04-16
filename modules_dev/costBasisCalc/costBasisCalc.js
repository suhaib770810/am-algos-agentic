import tradesByTicker from "../../modules_dev/mockData/90d/tradesByTicker.js";
import positionsByTicker from "../../modules_dev/mockData/90d/positionsByTicker.js";

const costBasisCalc = {
    costBasisByTicker: async () => {
        try {
            let costBasisByTicker = {};
            for (const ticker in tradesByTicker) {
                if (!costBasisByTicker[ticker]) {
                    costBasisByTicker[ticker] = {};
                }
                costBasisByTicker[ticker]["Cost Basis"] = 0;
                costBasisByTicker[ticker]["Position Size"] = 0;
                for (const trade of tradesByTicker[ticker]) {
                    costBasisByTicker[ticker]["Cost Basis"] += Number(trade["proceeds"]);
                    costBasisByTicker[ticker]["Position Size"] += Number(trade["quantity"]);
                }
                if (costBasisByTicker[ticker]["Position Size"] !== positionsByTicker[ticker][0]["position"]) {
                    costBasisByTicker[ticker]["Average Cost Basis"] = "Incomplete Trade Data";
                    continue;
                }
                if (costBasisByTicker[ticker]["Position Size"] === 0) {
                    costBasisByTicker[ticker]["Average Cost Basis"] = "Incomplete Trade Data";
                    continue;
                }
                costBasisByTicker[ticker]["Average Cost Basis"] = costBasisByTicker[ticker]["Cost Basis"] / costBasisByTicker[ticker]["Position Size"];
            }
            return costBasisByTicker;
        } catch (error) {
            console.error(`Error calculating cost basis by ticker: ${error}`);
            throw error;
        }
    },
};

export default costBasisCalc;