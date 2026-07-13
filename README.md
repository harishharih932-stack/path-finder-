# PathFinder — DSA Visual Lab

A pathfinding visualizer that shows **Dijkstra's algorithm**, **BFS**, and **A\*** exploring
a grid in real time and drawing the shortest path they find. Built to demonstrate
core data structure & algorithm concepts with a working, interactive UI — not just
a LeetCode function.

## DSA concepts demonstrated

| Concept | Where |
|---|---|
| Graph representation (grid as implicit graph) | `algorithms.py` |
| Min-heap / priority queue | `dijkstra()`, `astar()` via `heapq` |
| FIFO queue / level-order traversal | `bfs()` via `collections.deque` |
| Heuristic search | `astar()` — Manhattan distance heuristic |
| Path reconstruction (backtracking a predecessor map) | `reconstruct_path()` |
| Time/space complexity trade-offs | see below |

| Algorithm | Time complexity | Guarantees shortest path? |
|---|---|---|
| Dijkstra | O((V+E) log V) | Yes (weighted, non-negative) |
| BFS | O(V+E) | Yes (unweighted only) |
| A* | O((V+E) log V) | Yes (with an admissible heuristic) |

## How it works

1. The frontend (`static/script.js`) renders an editable grid. You can drag the
   start/end nodes and click-drag to draw walls, or auto-generate a random maze.
2. On **Visualize**, the grid + start/end + chosen algorithm are POSTed to
   `/api/solve`.
3. The Flask backend (`app.py`) runs the algorithm from `algorithms.py` and returns:
   - `visited`: every node in the order it was explored
   - `path`: the reconstructed shortest path (empty if unreachable)
4. The frontend animates the exploration wave, then draws the final path, and
   reports nodes visited / path length / compute time.

## Project structure

```
pathfinder-viz/
├── app.py              # Flask routes + API
├── algorithms.py        # Dijkstra, BFS, A* — the actual DSA
├── templates/
│   └── index.html       # Page markup
├── static/
│   ├── style.css        # Blueprint-style visual design
│   └── script.js         # Grid rendering, interaction, animation
├── requirements.txt
└── README.md
```

## Run it locally

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000**.

## Ideas to extend

- Add weighted terrain (e.g. "mud" cells that cost more to cross) to make
  Dijkstra vs. BFS behavior diverge visibly.
- Add Greedy Best-First Search to compare against A*.
- Add diagonal movement (8-directional) as a toggle.
- Persist mazes with a "save/load" button using localStorage-free server-side storage.

## License

MIT — free to use for learning, portfolio, or interview prep.
