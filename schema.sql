-- Esquema de base de datos: registro de partidos y estadisticas de jugadores
-- Modelo: cada partido lo juegan dos parejas armadas al momento (lado A vs lado B).
-- El administrador (tu) declara cual lado gano.

-- Si ya habias corrido una version anterior del esquema, esto la limpia primero:
DROP TABLE IF EXISTS match_events CASCADE;
DROP TABLE IF EXISTS match_players CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    match_date DATE NOT NULL,
    winner_side TEXT CHECK (winner_side IN ('A', 'B', 'draw')), -- NULL hasta que se declare ganador
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Une jugadores a un partido, indicando de que lado jugaron y cuantos goles metieron
CREATE TABLE match_players (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id),
    side TEXT NOT NULL CHECK (side IN ('A', 'B')),
    goals INTEGER NOT NULL DEFAULT 0,
    UNIQUE (match_id, player_id)
);

CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);
