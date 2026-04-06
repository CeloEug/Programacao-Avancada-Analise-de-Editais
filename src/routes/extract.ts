import { Router } from "express";
import { extractEdital } from "../services/extract.js";

export const extractRouter = Router();

extractRouter.post("/extract", async (req, res): Promise<void> => {
  const { editalText } = req.body as { editalText?: unknown };

  if (typeof editalText !== "string" || !editalText.trim()) {
    res.status(400).json({ error: "Campo obrigatório ausente: editalText (string)." });
    return;
  }

  try {
    const result = await extractEdital(editalText);
    res.json(result);
  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).json({ error: "Falha ao extrair informações do edital." });
  }
});
