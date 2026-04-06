# AGENTS.md

Reference for AI agents working in this repository.

## Project Overview

**Goal:** Reduce the hours researchers spend writing grant proposals. Given a funding call (*edital*) as a PDF or plain text, the system extracts its requirements, collects project metadata from the user, and generates a structured draft aligned to the edital's format and evaluation criteria.

**Target users:** Researchers and project managers with no formal grant-writing experience.

**Pipeline stages:**

```
PDF / text
    │
    ▼ Stage 1 — Ingest
Extract raw text from PDF (pdf-parse), normalize whitespace
    │
    ▼ Stage 2 — Extract
LLM identifies: deadline, evaluation criteria, format requirements, priority themes
    │
    ▼ Stage 3 — Generate
LLM produces a full project draft (6 standard sections) + compliance checklist
    │
    ▼ Stage 4 — Validate
LLM cross-checks the draft against the extracted requirements, lists gaps + suggestions
```

---

## Setup

```bash
cp .env.example .env        # add OPENAI_API_KEY
npm install
npm run dev                 # tsx watch — hot reload on port 3000
npm run build               # compile TypeScript → dist/
npm start                   # run compiled build
```

Requires Node >= 18. API docs at `http://localhost:3000/docs` (Swagger UI).

---

## File Map

```
src/
├── app.ts                  # Express server, route registration, Swagger UI mount
├── llm/
│   └── client.ts           # callLLM(prompt): wraps OpenAI SDK
├── services/
│   ├── ingest.ts           # extractText(buffer): PDF → clean string
│   ├── extract.ts          # extractEdital(text): text → ExtractionOutput
│   ├── pipeline.ts         # runPipeline(input): PipelineInput → PipelineOutput
│   └── validate.ts         # validateProject(requisitos, projeto): → ValidationOutput
├── routes/
│   ├── upload.ts           # POST /upload  (multipart PDF)
│   ├── extract.ts          # POST /extract (edital text)
│   ├── pipeline.ts         # POST /pipeline (generate draft)
│   └── validate.ts         # POST /validate (compliance check)
└── docs/
    └── swagger.ts          # OpenAPI 3.0 spec
```

---

## API Reference

### POST /upload

Upload a PDF edital; returns its extracted text.

**Request:** `multipart/form-data`, field `file` (PDF binary)

**Response:**
```json
{ "text": "<extracted plain text>" }
```

---

### POST /extract

Extract structured requirements from edital text.

**Request:**
```json
{ "editalText": "<plain text of the edital>" }
```

**Response:**
```json
{
  "prazo": "2024-06-30",
  "criterios": ["originality", "social impact", ...],
  "formato": "max 20 pages, font 12pt",
  "temas": ["health", "technology", ...]
}
```

---

### POST /pipeline

Generate a full project draft plus compliance checklist.

**Request:**
```json
{
  "editalText": "<plain text>",
  "titulo": "Project title",
  "descricao": "Short description",
  "objetivos": "Main objectives",
  "metodologia": "Methods",
  "orcamento": "Estimated budget",
  "equipe": "Team composition"
}
```

**Response:**
```json
{
  "projeto": "<full draft text with Introdução, Justificativa, Objetivos, Metodologia, Cronograma, Orçamento>",
  "checklist": { "<requirement>": "<status>", ... }
}
```

---

### POST /validate

Validate a project draft against extracted requirements.

**Request:**
```json
{
  "requisitos": "<requirements text or JSON string>",
  "projeto": "<project draft text>"
}
```

**Response:**
```json
{
  "ok": ["requirement met", ...],
  "faltando": ["missing requirement", ...],
  "sugestoes": ["suggestion for improvement", ...]
}
```

---

## TypeScript Interfaces

```typescript
// src/services/extract.ts
type ExtractionOutput = {
  prazo: string;
  criterios: string[];
  formato: string;
  temas: string[];
};

// src/services/pipeline.ts
type PipelineInput = {
  editalText: string;
  titulo: string;
  descricao: string;
  objetivos: string;
  metodologia: string;
  orcamento: string;
  equipe: string;
};

type PipelineOutput = {
  projeto: string;
  checklist: Record<string, unknown>;
};

// src/services/validate.ts
type ValidationOutput = {
  ok: string[];
  faltando: string[];
  sugestoes: string[];
};
```

---

## LLM Client

`src/llm/client.ts` — single exported function:

```typescript
callLLM(prompt: string): Promise<string>
```

| Setting       | Value         |
|---------------|---------------|
| Model         | `gpt-4.1`     |
| Temperature   | `0.3`         |
| Max tokens    | `1000`        |
| Env var       | `OPENAI_API_KEY` |

The client throws a typed error on API failure (`OpenAI APIError` is re-wrapped with status code). Always returns a non-empty string or throws.

---

## Prompt Engineering

Each service builds its own prompt and calls `callLLM` directly. All prompts instruct the model to return **only valid JSON, no markdown fences**.

### Stage 2 — Extract (`services/extract.ts`)

Instruction: extract `prazo`, `criterios`, `formato`, `temas` from the raw edital text. Returns an empty-but-valid `ExtractionOutput` on parse failure.

### Stage 3 — Generate (`services/pipeline.ts`)

Instruction: use the edital as primary reference; align the generated sections to its constraints and evaluation criteria. Produces the six standard sections (`Introdução`, `Justificativa`, `Objetivos`, `Metodologia`, `Cronograma`, `Orçamento`) and a compliance checklist in a single JSON object `{ projeto, checklist }`.

### Stage 4 — Validate (`services/validate.ts`)

Instruction: cross-check `projeto` against `requisitos`; categorize findings into `ok` (met), `faltando` (missing), `sugestoes` (improvements).

---

## Error Handling Pattern

All three LLM-backed services share the same defensive parsing pattern:

```typescript
function stripJsonFence(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : raw.trim();
}
```

1. Strip optional markdown code fences from the LLM response.
2. Attempt `JSON.parse`.
3. On failure: return an empty-but-valid output object (never throw to the caller).

For `pipeline.ts`, if `projeto` is not a string, the raw trimmed response is used as fallback so the caller always gets readable text.

---

## End-to-End Verification

```bash
# 1. Start server
npm run dev

# 2. Upload a real edital PDF
curl -F "file=@edital.pdf" http://localhost:3000/upload
# → { "text": "..." }

# 3. Extract requirements
curl -X POST http://localhost:3000/extract \
  -H "Content-Type: application/json" \
  -d '{"editalText": "<text from step 2>"}'
# → { "prazo": "...", "criterios": [...], "formato": "...", "temas": [...] }

# 4. Generate project draft
curl -X POST http://localhost:3000/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "editalText": "<text>",
    "titulo": "My Project",
    "descricao": "...",
    "objetivos": "...",
    "metodologia": "...",
    "orcamento": "R$ 50.000",
    "equipe": "2 researchers, 1 developer"
  }'
# → { "projeto": "...", "checklist": { ... } }

# 5. Validate compliance
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"requisitos": "<criteria text>", "projeto": "<draft from step 4>"}'
# → { "ok": [...], "faltando": [...], "sugestoes": [...] }

# 6. Browse interactive docs
open http://localhost:3000/docs
```
