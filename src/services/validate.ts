import { z } from "zod";
import { callLLM } from "../llm/client.js";

const ValidationOutputSchema = z.object({
  ok:        z.array(z.coerce.string()).catch([]),
  faltando:  z.array(z.coerce.string()).catch([]),
  sugestoes: z.array(z.coerce.string()).catch([]),
});

export type ValidationOutput = z.infer<typeof ValidationOutputSchema>;

function stripJsonFence(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : raw.trim();
}

export async function validateProject(
  requisitos: string,
  projeto: string
): Promise<ValidationOutput> {
  const prompt = `Verifique se o projeto atende aos requisitos e retorne APENAS JSON válido (sem markdown), no formato:
{
  "ok": [],
  "faltando": [],
  "sugestoes": []
}

Requisitos:
${requisitos}

Projeto:
${projeto}`;

  const raw = await callLLM(prompt);
  const trimmed = stripJsonFence(raw);

  try {
    return ValidationOutputSchema.parse(JSON.parse(trimmed));
  } catch {
    return ValidationOutputSchema.parse({});
  }
}
