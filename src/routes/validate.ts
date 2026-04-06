import { Router } from "express";
import { validateProject } from "../services/validate.js";

export const validateRouter = Router();

validateRouter.post("/validate", async (req, res): Promise<void> => {
  const { requisitos, projeto } = req.body as {
    requisitos?: unknown;
    projeto?: unknown;
  };

  if (typeof requisitos !== "string" || !requisitos.trim()) {
    res.status(400).json({ error: "Campo obrigatório ausente: requisitos (string)." });
    return;
  }
  if (typeof projeto !== "string" || !projeto.trim()) {
    res.status(400).json({ error: "Campo obrigatório ausente: projeto (string)." });
    return;
  }

  try {
    const result = await validateProject(requisitos, projeto);
    res.json(result);
  } catch (err) {
    console.error("Validation error:", err);
    res.status(500).json({ error: "Falha ao validar o projeto." });
  }
});
