import { callLLM } from "../llm/client.js";

export type ValidationOutput = {
  ok: string[];
  faltando: string[];
  sugestoes: string[];
};

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
    const parsed = JSON.parse(trimmed) as Partial<ValidationOutput>;
    return {
      ok: Array.isArray(parsed.ok) ? parsed.ok.map(String) : [],
      faltando: Array.isArray(parsed.faltando) ? parsed.faltando.map(String) : [],
      sugestoes: Array.isArray(parsed.sugestoes) ? parsed.sugestoes.map(String) : [],
    };
  } catch {
    return { ok: [], faltando: [], sugestoes: [] };
  }
}
