import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import { extractRouter } from "./routes/extract.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { uploadRouter } from "./routes/upload.js";
import { validateRouter } from "./routes/validate.js";

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.use(express.json());
app.use(express.static(publicDir));
app.use(uploadRouter);
app.use(extractRouter);
app.use(pipelineRouter);
app.use(validateRouter);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "API Docs",
  })
);

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
});

let isShuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down server...`);

  server.close((error) => {
    if (error) {
      console.error("Error while closing server:", error);
      process.exit(1);
    }

    console.log("Server closed.");
    process.exit(0);
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
