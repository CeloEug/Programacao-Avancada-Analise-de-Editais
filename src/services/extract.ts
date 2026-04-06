import { callLLM } from "../llm/client.js";

export type ExtractionOutput = {
  prazo: string;
  criterios: string[];
  formato: string;
  temas: string[];
};

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
    const parsed = JSON.parse(trimmed) as Partial<ExtractionOutput>;
    return {
      prazo: typeof parsed.prazo === "string" ? parsed.prazo : "",
      criterios: Array.isArray(parsed.criterios) ? parsed.criterios.map(String) : [],
      formato: typeof parsed.formato === "string" ? parsed.formato : "",
      temas: Array.isArray(parsed.temas) ? parsed.temas.map(String) : [],
    };
  } catch {
    return { prazo: "", criterios: [], formato: "", temas: [] };
  }
}
