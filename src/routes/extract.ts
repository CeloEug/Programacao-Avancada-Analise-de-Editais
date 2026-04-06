import { Router } from "express";
import { z } from "zod";
import { extractEdital } from "../services/extract.js";

export const extractRouter = Router();

const ExtractBodySchema = z.object({
  editalText: z.string().trim().min(1),
});

extractRouter.post("/extract", async (req, res): Promise<void> => {
  const parsed = ExtractBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Campo obrigatório ausente: editalText (string)." });
    return;
  }

  try {
    const result = await extractEdital(parsed.data.editalText);
    res.json(result);
  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).json({ error: "Falha ao extrair informações do edital." });
  }
});
