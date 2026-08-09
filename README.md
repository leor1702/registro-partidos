# Registro de partidos y estadísticas de jugadores

API para registrar partidos de fútbol (parejas de 2 jugadores por lado),
declarar el equipo ganador, y ver estadísticas: tabla general, goleadores,
y con qué compañeros gana más cada jugador.

## Instalación

1. Crear una base de datos Postgres (por ejemplo con [Neon](https://neon.tech)
   o [Supabase](https://supabase.com), ambos con capa gratuita).
2. Copiar `.env.example` a `.env` y completar `DATABASE_URL` con la cadena
   de conexión de tu base de datos.
3. Cargar el esquema (pégalo en el SQL Editor de Neon/Supabase, o con psql):
   ```
   psql $DATABASE_URL -f schema.sql
   ```
4. Instalar dependencias y arrancar:
   ```
   npm install
   npm run dev
   ```

## Flujo de uso

1. Crear los jugadores: `POST /players` con `{ "name": "Juan" }`.
2. Crear un partido con las dos parejas:
   ```
   POST /matches
   {
     "match_date": "2026-08-08",
     "side_a": [1, 2],
     "side_b": [3, 4]
   }
   ```
3. (Opcional) Registrar goles de cada jugador:
   ```
   PATCH /matches/1/goals
   { "player_id": 1, "goals": 2 }
   ```
4. Declarar el ganador:
   ```
   PATCH /matches/1/winner
   { "winner_side": "A" }
   ```
5. Consultar estadísticas:
   - `GET /stats/leaderboard` — tabla general (victorias, empates, derrotas, goles, puntos)
   - `GET /stats/top-scorers` — goleadores
   - `GET /stats/players/1/partners` — con quién ha jugado y ganado más el jugador 1

## Endpoints

- `GET /players` — listar jugadores
- `POST /players` — crear jugador
- `GET /matches` — listar partidos con sus jugadores
- `POST /matches` — crear partido (dos parejas)
- `PATCH /matches/:id/winner` — declarar ganador
- `PATCH /matches/:id/goals` — registrar goles de un jugador
- `GET /stats/leaderboard` — tabla general
- `GET /stats/top-scorers` — goleadores
- `GET /stats/players/:playerId/partners` — estadísticas con compañeros de equipo

## Notas

- Cada victoria suma 1 punto a cada jugador del equipo ganador. Si quieres
  otro sistema de puntos (por ejemplo 3-1-0 como en ligas), se puede ajustar
  en `src/routes/stats.js`.
- Por ahora no hay pantallas (frontend) — estos son solo los endpoints. Se
  puede probar con Postman/Insomnia o construir una interfaz web encima.
