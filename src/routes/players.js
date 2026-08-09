import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Listar todos los jugadores
router.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM players ORDER BY name");
  res.json(rows);
});

// Crear jugador
router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name es requerido" });
  const { rows } = await pool.query(
    "INSERT INTO players (name) VALUES ($1) RETURNING *",
    [name]
  );
  res.status(201).json(rows[0]);
});

export default router;
