import { z } from "zod";
import { callStructuredLLM } from "../llm/client.js";

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

If the edital or project data is insufficient, return the best possible draft and leave uncertain checklist items empty or generic rather than inventing unsupported requirements.`;

  const result = await callStructuredLLM(
    prompt,
    PipelineOutputSchema,
    "pipeline_output"
  );

  if (result.parsed) {
    return result.parsed;
  }

  return PipelineOutputSchema.parse({});
}
