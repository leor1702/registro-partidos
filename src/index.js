import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import playersRouter from "./routes/players.js";
import matchesRouter from "./routes/matches.js";
import statsRouter from "./routes/stats.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

app.use("/players", playersRouter);
app.use("/matches", matchesRouter);
app.use("/stats", statsRouter);

app.get("/api/status", (req, res) => {
  res.json({ status: "ok", service: "registro-partidos-api" });
});

// Sirve la interfaz visual (public/index.html) en http://localhost:3000
app.use(express.static(path.join(__dirname, "..", "public")));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
