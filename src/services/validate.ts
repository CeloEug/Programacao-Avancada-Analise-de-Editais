import { z } from "zod";
import { callStructuredLLM } from "../llm/client.js";

const ValidationOutputSchema = z.object({
  ok:        z.array(z.coerce.string()).catch([]),
  faltando:  z.array(z.coerce.string()).catch([]),
  sugestoes: z.array(z.coerce.string()).catch([]),
});

export type ValidationOutput = z.infer<typeof ValidationOutputSchema>;

export async function validateProject(
  requisitos: string,
  projeto: string
): Promise<ValidationOutput> {
  const prompt = `Verifique se o projeto atende aos requisitos.
Se algum ponto não puder ser avaliado com segurança, prefira deixá-lo fora das listas em vez de inventar uma conclusão.

Requisitos:
${requisitos}

Projeto:
${projeto}`;

  const result = await callStructuredLLM(
    prompt,
    ValidationOutputSchema,
    "validation_output"
  );

  if (result.parsed) {
    return result.parsed;
  }

  return ValidationOutputSchema.parse({});
}
