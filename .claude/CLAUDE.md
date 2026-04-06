# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Development server with hot reload (tsx watch)
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled build (requires npm run build first)
```

## Environment

Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.

## Architecture

Linear pipeline: PDF upload → text extraction → LLM prompt → project generation + compliance checklist.

**Routes** (`src/routes/`) — thin handlers that validate input, call services, and return JSON.

**Services** (`src/services/`) — business logic:
- `ingest.ts`: Extracts and cleans text from PDF buffers via `pdf-parse`
- `pipeline.ts`: Builds a structured prompt combining edital text + user-supplied metadata, calls the LLM, parses JSON response (with markdown fence stripping and fallback)

**LLM client** (`src/llm/client.ts`) — wraps OpenAI SDK; model `gpt-4.1`, temperature 0.3, max_tokens 1000.

**Docs** (`src/docs/swagger.ts`) — OpenAPI 3.0 spec served at `http://localhost:3000/docs`.

### POST /upload

Accepts multipart `file` (PDF), returns `{ text: string }`.

### POST /pipeline

Accepts JSON with `editalText`, `titulo`, `descricao`, `objetivos`, `metodologia`, `orcamento`, `equipe`. Returns `{ projeto: string, checklist: object }`.

The pipeline prompt instructs the LLM to output a single JSON object with those two keys. If parsing fails, `projeto` receives the raw LLM response and `checklist` is empty.
