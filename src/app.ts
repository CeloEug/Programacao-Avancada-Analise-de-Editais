import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { uploadRouter } from "./routes/upload.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(uploadRouter);
app.use(pipelineRouter);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "API Docs",
  })
);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
});
