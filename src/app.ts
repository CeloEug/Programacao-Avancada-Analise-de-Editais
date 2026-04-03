import "dotenv/config";
import express from "express";
import { uploadRouter } from "./routes/upload.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(uploadRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
