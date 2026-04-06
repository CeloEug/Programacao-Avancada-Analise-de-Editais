import { Router } from "express";
import { z } from "zod";
import { runPipeline } from "../services/pipeline.js";

export const pipelineRouter = Router();

const PipelineBodySchema = z.object({
  editalText:  z.string().trim().min(1),
  titulo:      z.string().trim().min(1),
  descricao:   z.string().trim().min(1),
  objetivos:   z.string().trim().min(1),
  metodologia: z.string().trim().min(1),
  orcamento:   z.string().trim().min(1),
  equipe:      z.string().trim().min(1),
});

pipelineRouter.post("/pipeline", async (req, res): Promise<void> => {
  const parsed = PipelineBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error:
        "Invalid body. Required JSON string fields: editalText, titulo, descricao, objetivos, metodologia, orcamento, equipe.",
    });
    return;
  }

  try {
    const result = await runPipeline(parsed.data);
    res.json(result);
  } catch (err) {
    console.error("Pipeline error:", err);
    res.status(500).json({
      error: "Failed to run pipeline or call LLM.",
    });
  }
});
