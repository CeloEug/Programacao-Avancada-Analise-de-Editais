import { Router } from "express";
import { z } from "zod";
import { validateProject } from "../services/validate.js";

export const validateRouter = Router();

const ValidateBodySchema = z.object({
  requisitos: z.string().trim().min(1),
  projeto:    z.string().trim().min(1),
});

validateRouter.post("/validate", async (req, res): Promise<void> => {
  const parsed = ValidateBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Campos obrigatórios ausentes: requisitos e projeto (strings)." });
    return;
  }

  try {
    const result = await validateProject(parsed.data.requisitos, parsed.data.projeto);
    res.json(result);
  } catch (err) {
    console.error("Validation error:", err);
    res.status(500).json({ error: "Falha ao validar o projeto." });
  }
});
