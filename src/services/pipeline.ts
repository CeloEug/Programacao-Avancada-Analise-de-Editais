import { callLLM } from "../llm/client.js";

export type PipelineInput = {
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
  const prompt = `Com base nos dados abaixo, produza um resumo executivo do projeto e um checklist de conformidade para editais públicos.

Dados:
- Título: ${input.titulo}
- Descrição: ${input.descricao}
- Objetivos: ${input.objetivos}
- Metodologia: ${input.metodologia}
- Orçamento: ${input.orcamento}
- Equipe: ${input.equipe}

Responda APENAS com um JSON válido (sem markdown), no formato exato:
{"projeto":"texto em um único parágrafo ou texto corrido","checklist":{"item_chave":"valor ou status string"}}`;

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
