# Tender AI Agent

A LangChain ReAct agent that helps users find, understand, and evaluate
South African government tenders.

## What it does

You send a natural-language message:

> "Find IT tenders in the Western Cape that close next month."

The agent:

1. **Thinks** about what to do
2. **Calls tools** to search, fetch details, analyze, or match tenders
3. **Returns** a natural-language answer with the results

Under the hood it uses:

- **Ollama** (`llama3.2:3b`) — the LLM that makes decisions
- **client-api** — a tool for searching and fetching tenders
- **ai service** — a tool for analyzing tenders and matching business profiles
- **LangChain** — the framework that ties tools + LLM into an agent

<!-- trigger -->

<!-- deploy trigger -->
