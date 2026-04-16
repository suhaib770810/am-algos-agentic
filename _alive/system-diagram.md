# System Diagram

## Structure Manifest
- [Overview](#overview)
- [Architecture](#architecture)
- [Data Flow](#data-flow)
- [Tech Stack](#tech-stack)
- [File Map](#file-map)
- [Next](#next)

## Overview
`am-algos-agentic` is an algorithm and analysis engine. It consumes data provided by `am-ds-agentic` to perform complex financial calculations and trading analysis.

## Architecture
Node.js application (ES Modules) focused on computational logic and reporting. It integrates with external communication services like Mailgun and Notion.

## Data Flow
1. **Ingest**: Retrieves data from the central database (managed by `am-ds-agentic`).
2. **Analyze**: Runs various analysis modules (LIFO, Price Range, Fixed Allocation).
3. **Report**: Generates results and distributes them via Mailgun or posts to Notion.

## Tech Stack
- **Runtime**: Node.js 20+
- **Reporting**: Mailgun.js, ejs
- **Automation**: n8n (Notion)

## File Map
- `am_32_algos.js`: Main execution engine.
- `modules/`: Analysis logic (lifo-match, priceRange, etc.).
- `modules_com/`: Shared communication and DB modules.

## Next
- Refactor analysis modules for better testability.
- Expand Notion integration for more granular reporting.
