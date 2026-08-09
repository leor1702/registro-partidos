const API = "";

let players = [];

function showToast(msg, isError) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.toggle("error", !!isError);
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toast.hidden = true), 3000);
}

async function api(path, options) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function playerName(id) {
  const p = players.find((pl) => pl.id === id);
  return p ? p.name : `#${id}`;
}

function playerOptionsHtml() {
  return players.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
}

// Genera N <select> de jugador dentro de un contenedor (uno por puesto del lado)
function renderSideSelects(containerId, count) {
  const container = document.getElementById(containerId);
  container.innerHTML = Array.from({ length: count })
    .map((_, i) => `<select data-slot="${i}" required>${playerOptionsHtml()}</select>`)
    .join("");
}

function renderTeamSizeSelects() {
  const size = Number(document.getElementById("team-size").value) || 1;
  renderSideSelects("side-a-selects", size);
  renderSideSelects("side-b-selects", size);
}

function fillPlayerSelects() {
  const partnerSelect = document.getElementById("partner-player");
  const current = partnerSelect.value;
  partnerSelect.innerHTML = playerOptionsHtml();
  if (current) partnerSelect.value = current;

  renderTeamSizeSelects();
}

async function loadPlayers() {
  players = await api("/players");
  const list = document.getElementById("player-list");
  list.innerHTML = players.map((p) => `<li>${p.name}</li>`).join("");
  fillPlayerSelects();
}

async function loadLeaderboard() {
  const rows = await api("/stats/leaderboard");
  const tbody = document.querySelector("#leaderboard-table tbody");
  tbody.innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${r.name}</td>
        <td>${r.matches_played}</td>
        <td>${r.wins}</td>
        <td>${r.draws}</td>
        <td>${r.losses}</td>
        <td>${r.goals}</td>
        <td>${r.points}</td>
      </tr>`
    )
    .join("");
  document.getElementById("leaderboard-empty").hidden = rows.length > 0;
}

async function loadMatches() {
  const matches = await api("/matches");
  const list = document.getElementById("match-list");
  document.getElementById("matches-empty").hidden = matches.length > 0;

  list.innerHTML = matches
    .map((m) => {
      const names = (side) => side.map((p) => p.name).join(" y ");
      const winLabel = (side) =>
        m.winner_side === side ? '<span class="win">(ganador)</span>' : "";
      const status =
        m.winner_side == null
          ? '<span class="status-pending">Pendiente de resultado</span>'
          : m.winner_side === "draw"
          ? "Empate"
          : "";
      const actions =
        m.winner_side == null
          ? `<div class="match-actions">
               <button class="btn-outline" onclick="setWinner(${m.id}, 'A')">Gano A</button>
               <button class="btn-outline" onclick="setWinner(${m.id}, 'B')">Gano B</button>
               <button class="btn-outline" onclick="setWinner(${m.id}, 'draw')">Empate</button>
             </div>`
          : "";
      return `<div class="match-row">
        <div>
          <div class="match-teams">${names(m.side_a)} ${winLabel("A")} vs ${names(m.side_b)} ${winLabel("B")}</div>
          <div class="match-date">${m.match_date.slice(0, 10)} · ${status}</div>
        </div>
        ${actions}
      </div>`;
    })
    .join("");
}

async function setWinner(matchId, side) {
  try {
    await api(`/matches/${matchId}/winner`, {
      method: "PATCH",
      body: JSON.stringify({ winner_side: side }),
    });
    showToast("Resultado guardado");
    await Promise.all([loadMatches(), loadLeaderboard()]);
  } catch (err) {
    showToast(err.message, true);
  }
}

async function loadPartners() {
  const select = document.getElementById("partner-player");
  if (!select.value) return;
  const rows = await api(`/stats/players/${select.value}/partners`);
  const list = document.getElementById("partner-list");
  document.getElementById("partners-empty").hidden = rows.length > 0;
  list.innerHTML = rows
    .map(
      (r) =>
        `<li>${r.name} — <span class="win-rate">${r.wins_together}/${r.matches_together} victorias juntos</span></li>`
    )
    .join("");
}

document.getElementById("player-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("player-name");
  try {
    await api("/players", {
      method: "POST",
      body: JSON.stringify({ name: input.value.trim() }),
    });
    input.value = "";
    showToast("Jugador agregado");
    await loadPlayers();
  } catch (err) {
    showToast(err.message, true);
  }
});

document.getElementById("team-size").addEventListener("input", renderTeamSizeSelects);

document.getElementById("match-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const readSide = (containerId) =>
    Array.from(document.querySelectorAll(`#${containerId} select`)).map((s) => Number(s.value));
  const side_a = readSide("side-a-selects");
  const side_b = readSide("side-b-selects");
  const allIds = [...side_a, ...side_b];
  if (new Set(allIds).size !== allIds.length) {
    showToast("Cada jugador solo puede estar una vez en el partido", true);
    return;
  }
  try {
    await api("/matches", {
      method: "POST",
      body: JSON.stringify({
        match_date: document.getElementById("match-date").value,
        side_a,
        side_b,
      }),
    });
    showToast("Partido creado");
    await loadMatches();
  } catch (err) {
    showToast(err.message, true);
  }
});

document.getElementById("partner-player").addEventListener("change", loadPartners);

(async function init() {
  document.getElementById("match-date").valueAsDate = new Date();
  await loadPlayers();
  await Promise.all([loadLeaderboard(), loadMatches()]);
  await loadPartners();
})();
