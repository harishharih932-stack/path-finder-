// ============================================================
// script.js — grid UI + interaction + animation of results
// coming from the Flask /api/solve endpoint (Dijkstra/BFS/A*).
// ============================================================

const ROWS = 18;
const COLS = 34;

const state = {
  grid: Array.from({ length: ROWS }, () => Array(COLS).fill(0)), // 0 empty, 1 wall
  start: [Math.floor(ROWS / 2), 4],
  end: [Math.floor(ROWS / 2), COLS - 5],
  algorithm: "dijkstra",
  dragging: null,      // "start" | "end" | "wall" | "erase" | null
  animating: false,
};

const gridEl = document.getElementById("grid");
gridEl.style.gridTemplateColumns = `repeat(${COLS}, 24px)`;

const cells = [];

function buildGrid() {
  gridEl.innerHTML = "";
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const div = document.createElement("div");
      div.className = "cell";
      div.dataset.r = r;
      div.dataset.c = c;
      gridEl.appendChild(div);
      row.push(div);
    }
    cells.push(row);
  }
}
buildGrid();

function cellAt(r, c) {
  return cells[r][c];
}

function isStart(r, c) { return r === state.start[0] && c === state.start[1]; }
function isEnd(r, c) { return r === state.end[0] && c === state.end[1]; }

function render() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const el = cellAt(r, c);
      el.className = "cell";
      if (isStart(r, c)) el.classList.add("start");
      else if (isEnd(r, c)) el.classList.add("end");
      else if (state.grid[r][c] === 1) el.classList.add("wall");
    }
  }
}
render();

// ---------- Mouse interaction ----------
gridEl.addEventListener("mousedown", (e) => {
  if (state.animating) return;
  const target = e.target.closest(".cell");
  if (!target) return;
  const r = +target.dataset.r, c = +target.dataset.c;

  if (isStart(r, c)) state.dragging = "start";
  else if (isEnd(r, c)) state.dragging = "end";
  else {
    state.dragging = state.grid[r][c] === 1 ? "erase" : "wall";
    toggleWall(r, c, state.dragging === "wall");
  }
});

gridEl.addEventListener("mouseover", (e) => {
  if (!state.dragging || state.animating) return;
  const target = e.target.closest(".cell");
  if (!target) return;
  const r = +target.dataset.r, c = +target.dataset.c;

  if (state.dragging === "start" && !isEnd(r, c) && state.grid[r][c] === 0) {
    state.start = [r, c];
    render();
  } else if (state.dragging === "end" && !isStart(r, c) && state.grid[r][c] === 0) {
    state.end = [r, c];
    render();
  } else if (state.dragging === "wall" || state.dragging === "erase") {
    toggleWall(r, c, state.dragging === "wall");
  }
});

window.addEventListener("mouseup", () => { state.dragging = null; });

function toggleWall(r, c, makeWall) {
  if (isStart(r, c) || isEnd(r, c)) return;
  state.grid[r][c] = makeWall ? 1 : 0;
  render();
}

// ---------- Algorithm selector ----------
const algoNotes = {
  dijkstra: "Min-heap priority queue · guarantees shortest path on weighted grid.",
  bfs: "FIFO queue · explores layer by layer, optimal on unweighted grids.",
  astar: "Min-heap + Manhattan heuristic · aims straight for the goal, still optimal.",
};

document.getElementById("algoSelect").addEventListener("click", (e) => {
  const btn = e.target.closest(".segmented__opt");
  if (!btn) return;
  document.querySelectorAll(".segmented__opt").forEach(b => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  state.algorithm = btn.dataset.algo;
  document.getElementById("algoNote").textContent = algoNotes[state.algorithm];
});

// ---------- Board buttons ----------
document.getElementById("clearWallsBtn").addEventListener("click", () => {
  if (state.animating) return;
  state.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  render();
  resetStats();
});

document.getElementById("clearPathBtn").addEventListener("click", () => {
  if (state.animating) return;
  render();
  resetStats();
});

document.getElementById("mazeBtn").addEventListener("click", () => {
  if (state.animating) return;
  const density = 0.28;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isStart(r, c) || isEnd(r, c)) continue;
      state.grid[r][c] = Math.random() < density ? 1 : 0;
    }
  }
  render();
  resetStats();
});

// ---------- Visualize ----------
document.getElementById("visualizeBtn").addEventListener("click", runVisualization);

async function runVisualization() {
  if (state.animating) return;
  render();
  resetStats();
  setStatus("computing…");

  const t0 = performance.now();
  let data;
  try {
    const res = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grid: state.grid,
        start: state.start,
        end: state.end,
        algorithm: state.algorithm,
      }),
    });
    data = await res.json();
  } catch (err) {
    setStatus("error — is the server running?");
    return;
  }
  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);

  state.animating = true;
  const speed = 101 - document.getElementById("speed").value; // ms per step
  const delay = Math.max(2, speed / 3);

  let i = 0;
  const visited = data.visited.filter(([r, c]) => !isStart(r, c) && !isEnd(r, c));

  function stepVisited() {
    if (i >= visited.length) {
      animatePath(data, elapsed);
      return;
    }
    const [r, c] = visited[i];
    cellAt(r, c).classList.add("visited");
    i++;
    setTimeout(stepVisited, delay);
  }
  stepVisited();
}

function animatePath(data, elapsed) {
  const path = data.path.filter(([r, c]) => !isStart(r, c) && !isEnd(r, c));
  let i = 0;
  function stepPath() {
    if (i >= path.length) {
      finish(data, elapsed);
      return;
    }
    const [r, c] = path[i];
    cellAt(r, c).classList.add("path");
    i++;
    setTimeout(stepPath, 16);
  }
  stepPath();
}

function finish(data, elapsed) {
  state.animating = false;
  document.getElementById("statVisited").textContent = String(data.visited_count).padStart(3, "0");
  document.getElementById("statPath").textContent = String(data.path_length).padStart(3, "0");
  document.getElementById("statTime").textContent = `${elapsed}s`;
  setStatus(data.found ? "path found" : "no path");
}

function resetStats() {
  document.getElementById("statVisited").textContent = "000";
  document.getElementById("statPath").textContent = "000";
  document.getElementById("statTime").textContent = "0.00s";
  setStatus("idle");
}

function setStatus(text) {
  document.getElementById("statStatus").textContent = text;
}
