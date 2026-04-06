import { z } from "zod";
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

const PipelineOutputSchema = z.object({
  projeto:   z.string().catch(""),
  checklist: z.record(z.string(), z.unknown()).catch({}),
});

export type PipelineOutput = z.infer<typeof PipelineOutputSchema>;

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
    const result = PipelineOutputSchema.parse(JSON.parse(trimmed));
    return {
      projeto: result.projeto || trimmed,
      checklist: result.checklist,
    };
  } catch {
    return { projeto: raw, checklist: {} };
  }
}
