import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { parsePDF } from "../services/ingest.js";
import { extractEdital } from "../services/extract.js";
import { runPipeline } from "../services/pipeline.js";
import { validateProject } from "../services/validate.js";

const upload = multer({ storage: multer.memoryStorage() });

export const generateRouter = Router();

const BodySchema = z.object({
  titulo:      z.string().trim().min(1),
  descricao:   z.string().trim().min(1),
  objetivos:   z.string().trim().min(1),
  metodologia: z.string().trim().min(1),
  orcamento:   z.string().trim().min(1),
  equipe:      z.string().trim().min(1),
});

generateRouter.post(
  "/generate",
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file?.buffer) {
      res.status(400).json({ error: "Campo obrigatório ausente: file (PDF em multipart)." });
      return;
    }

    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error:
          "Campos obrigatórios ausentes: titulo, descricao, objetivos, metodologia, orcamento, equipe.",
      });
      return;
    }

    try {
      // Stage 1 — Ingest
      const editalText = await parsePDF(req.file.buffer);

      // Stage 2 — Extract
      const requisitos = await extractEdital(editalText);

      // Stage 3 — Generate
      const { projeto, checklist } = await runPipeline({ editalText, ...parsed.data });

      // Stage 4 — Validate
      const validacao = await validateProject(JSON.stringify(requisitos), projeto);

      res.json({ requisitos, projeto, checklist, validacao });
    } catch (err) {
      console.error("Generate error:", err);
      res.status(500).json({ error: "Falha ao processar o edital." });
    }
  }
);