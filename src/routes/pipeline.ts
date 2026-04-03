import { Router } from "express";
import { runPipeline } from "../services/pipeline.js";
import type { PipelineInput } from "../services/pipeline.js";

export const pipelineRouter = Router();

const FIELDS: (keyof PipelineInput)[] = [
  "editalText",
  "titulo",
  "descricao",
  "objetivos",
  "metodologia",
  "orcamento",
  "equipe",
];

function readBody(body: unknown): PipelineInput | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const out: Partial<PipelineInput> = {};
  for (const key of FIELDS) {
    const v = o[key];
    if (typeof v !== "string" || !v.trim()) return null;
    out[key] = v.trim();
  }
  return out as PipelineInput;
}

pipelineRouter.post("/pipeline", async (req, res): Promise<void> => {
  const input = readBody(req.body);
  if (!input) {
    res.status(400).json({
      error:
        "Invalid body. Required JSON string fields: editalText, titulo, descricao, objetivos, metodologia, orcamento, equipe.",
    });
    return;
  }

  try {
    const result = await runPipeline(input);
    res.json(result);
  } catch (err) {
    console.error("Pipeline error:", err);
    res.status(500).json({
      error: "Failed to run pipeline or call LLM.",
    });
  }
});
