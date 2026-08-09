import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Tabla general: victorias, derrotas, partidos jugados y goles por jugador
router.get("/leaderboard", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.name,
       COUNT(*) AS matches_played,
       COUNT(*) FILTER (WHERE mp.side = m.winner_side) AS wins,
       COUNT(*) FILTER (WHERE m.winner_side = 'draw') AS draws,
       COUNT(*) FILTER (WHERE m.winner_side IS NOT NULL AND m.winner_side != 'draw' AND mp.side != m.winner_side) AS losses,
       COALESCE(SUM(mp.goals), 0) AS goals,
       COUNT(*) FILTER (WHERE mp.side = m.winner_side) AS points
     FROM match_players mp
     JOIN matches m ON m.id = mp.match_id
     JOIN players p ON p.id = mp.player_id
     GROUP BY p.id, p.name
     ORDER BY points DESC, goals DESC`
  );
  res.json(rows);
});

// Goleadores
router.get("/top-scorers", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, COALESCE(SUM(mp.goals), 0) AS goals
     FROM match_players mp
     JOIN players p ON p.id = mp.player_id
     GROUP BY p.id, p.name
     HAVING COALESCE(SUM(mp.goals), 0) > 0
     ORDER BY goals DESC`
  );
  res.json(rows);
});

// Con que companeros de equipo ha jugado y ganado mas un jugador
router.get("/players/:playerId/partners", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       p2.id, p2.name,
       COUNT(*) AS matches_together,
       COUNT(*) FILTER (WHERE mp1.side = m.winner_side) AS wins_together
     FROM match_players mp1
     JOIN match_players mp2
       ON mp1.match_id = mp2.match_id
      AND mp1.side = mp2.side
      AND mp1.player_id != mp2.player_id
     JOIN matches m ON m.id = mp1.match_id
     JOIN players p2 ON p2.id = mp2.player_id
     WHERE mp1.player_id = $1
     GROUP BY p2.id, p2.name
     ORDER BY wins_together DESC, matches_together DESC`,
    [req.params.playerId]
  );
  res.json(rows);
});

export default router;
