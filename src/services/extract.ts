import { z } from "zod";
import { callStructuredLLM } from "../llm/client.js";

const ExtractionOutputSchema = z.object({
  prazo:     z.string().catch(""),
  criterios: z.array(z.coerce.string()).catch([]),
  formato:   z.string().catch(""),
  temas:     z.array(z.coerce.string()).catch([]),
});

export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;

export async function extractEdital(editalText: string): Promise<ExtractionOutput> {
  const prompt = `Extraia prazo, critérios, formato e temas do edital abaixo.
Se alguma informação não estiver disponível com segurança, retorne string vazia ou array vazio no campo correspondente.

Edital:
${editalText}`;

  const result = await callStructuredLLM(
    prompt,
    ExtractionOutputSchema,
    "extraction_output"
  );

  if (result.parsed) {
    return result.parsed;
  }

  return ExtractionOutputSchema.parse({});
}
