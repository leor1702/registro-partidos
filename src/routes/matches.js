import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Listar partidos con sus jugadores
router.get("/", async (req, res) => {
  const { rows: matches } = await pool.query(
    "SELECT * FROM matches ORDER BY match_date DESC, id DESC"
  );
  const { rows: players } = await pool.query(
    `SELECT mp.match_id, mp.side, mp.goals, p.id AS player_id, p.name
     FROM match_players mp JOIN players p ON p.id = mp.player_id`
  );
  const result = matches.map((m) => ({
    ...m,
    side_a: players.filter((p) => p.match_id === m.id && p.side === "A"),
    side_b: players.filter((p) => p.match_id === m.id && p.side === "B"),
  }));
  res.json(result);
});

// Crear partido: N jugadores por lado (1 a 11), ambos lados del mismo tamaño
// body: { match_date, side_a: [player_id, ...], side_b: [player_id, ...] }
router.post("/", async (req, res) => {
  const { match_date, side_a, side_b } = req.body;
  if (!match_date || !Array.isArray(side_a) || !Array.isArray(side_b)) {
    return res.status(400).json({ error: "match_date, side_a y side_b son requeridos" });
  }
  const size = side_a.length;
  if (size < 1 || size > 11) {
    return res.status(400).json({ error: "cada lado debe tener entre 1 y 11 jugadores" });
  }
  if (side_b.length !== size) {
    return res.status(400).json({ error: "ambos lados deben tener la misma cantidad de jugadores" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "INSERT INTO matches (match_date) VALUES ($1) RETURNING *",
      [match_date]
    );
    const match = rows[0];

    for (const playerId of side_a) {
      await client.query(
        "INSERT INTO match_players (match_id, player_id, side) VALUES ($1, $2, 'A')",
        [match.id, playerId]
      );
    }
    for (const playerId of side_b) {
      await client.query(
        "INSERT INTO match_players (match_id, player_id, side) VALUES ($1, $2, 'B')",
        [match.id, playerId]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(match);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Declarar el equipo ganador de un partido
// body: { winner_side: 'A' | 'B' | 'draw' }
router.patch("/:id/winner", async (req, res) => {
  const { winner_side } = req.body;
  if (!["A", "B", "draw"].includes(winner_side)) {
    return res.status(400).json({ error: "winner_side debe ser 'A', 'B' o 'draw'" });
  }
  const { rows } = await pool.query(
    "UPDATE matches SET winner_side = $1 WHERE id = $2 RETURNING *",
    [winner_side, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Partido no encontrado" });
  res.json(rows[0]);
});

// Registrar goles de un jugador en un partido
// body: { player_id, goals }
router.patch("/:id/goals", async (req, res) => {
  const { player_id, goals } = req.body;
  if (!player_id || goals == null) {
    return res.status(400).json({ error: "player_id y goals son requeridos" });
  }
  const { rows } = await pool.query(
    `UPDATE match_players SET goals = $1
     WHERE match_id = $2 AND player_id = $3 RETURNING *`,
    [goals, req.params.id, player_id]
  );
  if (!rows.length) return res.status(404).json({ error: "Ese jugador no esta en ese partido" });
  res.json(rows[0]);
});

export default router;
