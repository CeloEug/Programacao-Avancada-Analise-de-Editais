import { z } from "zod";
import { callLLM } from "../llm/client.js";

const ExtractionOutputSchema = z.object({
  prazo:     z.string().catch(""),
  criterios: z.array(z.coerce.string()).catch([]),
  formato:   z.string().catch(""),
  temas:     z.array(z.coerce.string()).catch([]),
});

export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;

function stripJsonFence(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : raw.trim();
}

export async function extractEdital(editalText: string): Promise<ExtractionOutput> {
  const prompt = `Extraia prazo, critérios, formato e temas deste edital e retorne em JSON.

Retorne APENAS JSON válido (sem markdown), no formato:
{
  "prazo": "",
  "criterios": [],
  "formato": "",
  "temas": []
}

Edital:
${editalText}`;

  const raw = await callLLM(prompt);
  const trimmed = stripJsonFence(raw);

  try {
    return ExtractionOutputSchema.parse(JSON.parse(trimmed));
  } catch {
    return ExtractionOutputSchema.parse({});
  }
}
