import { Router } from "express";
import multer from "multer";
import { parsePDF } from "../services/ingest.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRouter = Router();

uploadRouter.post(
  "/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file?.buffer) {
      console.warn("Upload rejected: missing multipart field \"file\"");
      res.status(400).json({
        error: "No file uploaded. Expected multipart field \"file\".",
      });
      return;
    }

    try {
      const text = await parsePDF(req.file.buffer);
      res.json({ text });
    } catch (err) {
      console.error("PDF parse error:", err);
      res.status(500).json({
        error: "Failed to parse PDF or extract text.",
      });
    }
  }
);
