import { callLLM } from "../llm/client.js";

export type PipelineInput = {
  editalText: string;
  titulo: string;
  descricao: string;
  objetivos: string;
  metodologia: string;
  orcamento: string;
  equipe: string;
};

export type PipelineOutput = {
  projeto: string;
  checklist: Record<string, unknown>;
};

function stripJsonFence(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : raw.trim();
}

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const prompt = `Based on the following edital:

${input.editalText}

And the project data:

- Title: ${input.titulo}
- Description: ${input.descricao}
- Objectives: ${input.objetivos}
- Methodology: ${input.metodologia}
- Budget: ${input.orcamento}
- Team: ${input.equipe}

Use the edital content as the primary reference. Align the generated project with the edital's requirements, constraints, and evaluation criteria.

Generate a COMPLETE project with:

* Introdução
* Justificativa
* Objetivos
* Metodologia
* Cronograma
* Orçamento

Then generate a compliance checklist based on the edital.

Return ONLY valid JSON (no markdown):
{
"projeto": "...",
"checklist": { ... }
}`;

  const raw = await callLLM(prompt);
  const trimmed = stripJsonFence(raw);

  try {
    const parsed = JSON.parse(trimmed) as {
      projeto?: unknown;
      checklist?: unknown;
    };
    const projeto =
      typeof parsed.projeto === "string" ? parsed.projeto : trimmed;
    const checklist =
      parsed.checklist !== null &&
        typeof parsed.checklist === "object" &&
        !Array.isArray(parsed.checklist)
        ? (parsed.checklist as Record<string, unknown>)
        : {};
    return { projeto, checklist };
  } catch {
    return { projeto: raw, checklist: {} };
  }
}
