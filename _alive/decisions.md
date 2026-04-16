# Decisions

This file tracks the current architectural and design decisions for `am-algos-agentic`.

## Current Implementation

### 1. LIFO (Last-In-First-Out) Matching
- **Status**: Implemented in `modules/lifo-match/`.
- **Logic**: Processes trade logs to identify specific "lots". When a sale occurs, it matches against the most recent buy transaction (LIFO).
- **Persistence**: Uses SQLite3 to maintain `openPositions`, `closedPositions`, and `timeStamps`.
- **Fidelity**: Includes a `positionFidelityChecker` that compares LIFO-calculated positions against real-time positions from the Data Service.

### 2. Price Range Analysis
- **Status**: Implemented in `modules/priceRange/`.
- **Logic**: Calculates a target price range based on a configurable `DELTA_PERCENTAGE`.
- **Recommendations**: Generates "Buy" if price is below floor, "Sell" if above ceiling, and "Hold" otherwise.

### 3. Fixed Allocation Recommendations
- **Status**: Implemented in `modules/fixedAllocRecs/`.
- **Patterns**: Supports both single-amount allocation and range-based (Floor/Ceiling) allocation.
- **Goal**: Suggests contract adjustments to align position value with the target allocation.

### 4. Trades P&L Analysis
- **Status**: Implemented in `modules/tradesPLanalysis/`.
- **Output**: Generates realized and unrealized P&L aggregated by individual position and by underlying symbol.

### 5. Data Ingestion & Integration
- **Status**: Implemented in `modules/dataFromDS/`.
- **Source**: Decoupled from the database, fetching data via HTTP from `am-ds-agentic`.
- **Distribution**: Results are pushed to Notion (via n8n webhooks) and emailed via Mailgun (using EJS templates).

---

## Architectural Evaluation

The system follows a **Modular Analysis Engine** pattern. It is designed to be a "stateless" processor of stateful data fetched from an external service, using a local SQLite database to reconstruct and maintain trade lots.

### Critical Evaluation:
- **Modularity (High)**: Each analysis module is independent and can be tested or replaced without affecting others.
- **Reliability (Medium)**: The system relies heavily on the synchronization between `am-ds-agentic` and the local SQLite state. Discrepancies are caught by the fidelity checker but require manual intervention.
- **Security (Low)**: Direct SQL query construction via template literals in `lifo-match.js` is a significant risk for SQL injection if input sources are ever compromised.
- **Maintainability (Medium)**: Lack of a formal test suite makes refactoring risky. Extensive use of `console.log` for flow control should be replaced with structured logging.

---

## Major Implementation Decisions: Pros & Cons

### Decision: Local SQLite for LIFO Tracking
- **Pros**:
    - Enables accurate cost-basis tracking for specific lots (essential for tax and precise P&L).
    - Persists state across runs, allowing the engine to process only "new" trades since the last timestamp.
    - Provides a queryable audit trail of all closed and open positions.
- **Cons**:
    - Introduces a stateful dependency in an otherwise functional-leaning engine.
    - Risk of "state drift" if the local DB becomes out of sync with the upstream Data Service.
    - Performance may degrade if the trade history grows into the hundreds of thousands (unlikely for this specific use case).

### Decision: Decoupled Data Service (am-ds-agentic)
- **Pros**:
    - Separates concerns: `ds` handles ingestion and normalization, `algos` handles strategy and analysis.
    - Allows the analysis engine to be run in different environments (Cloud, Local, Dev) using the same data source.
- **Cons**:
    - Network latency and dependency; if `ds` is down, `algos` cannot function.
    - Requires strict schema synchronization between the two projects.

### Decision: Range-based Fixed Allocation (Floor/Ceiling)
- **Pros**:
    - Significantly reduces "churn" (frequent tiny trades) by only recommending action when a position value drifts outside a comfortable buffer.
    - More realistic for manual trading or low-frequency automated execution.
- **Cons**:
    - The "Next Recommendation" logic is simplified and uses the floor as a primary reference, which might not be mathematically optimal in all market conditions.

---

## Proposed Technical Improvements

1. **Security & Stability**:
    - **Parameterized Queries**: Replace all template-literal SQL strings in `lifo-match.js` and `dbQueries.js` with parameterized inputs to eliminate SQL injection risks.
    - **BigInt/Decimal.js**: Transition financial calculations from standard JS Numbers to a library that handles decimal precision to avoid floating-point errors in P&L.

2. **Development Lifecycle**:
    - **Automated Testing**: Implement a test suite (using Vitest or Jest) specifically for the LIFO matching logic and price range calculations.
    - **Structured Logging**: Integrate `winston` or `pino` to allow for different log levels (DEBUG, INFO, ERROR) and potential export to log aggregators.

3. **Integration & Infrastructure**:
    - **Retry Logic**: Implement exponential backoff for the Data Service fetches and Mailgun/Notion API calls.
    - **Submodule Verification**: Add a pre-flight check to ensure `modules_com` is initialized and reachable.

4. **Code Quality**:
    - **JSDoc/TypeScript**: Add JSDoc to all module exports to improve IDE intellisense and reduce "shape" errors when passing data between modules.
