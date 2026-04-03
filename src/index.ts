import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "API no ar" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.listen(PORT, () => {
  console.log(`Servidor em http://localhost:${PORT}`);
});
