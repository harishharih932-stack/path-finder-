"""
app.py
------
Flask backend for the DSA Pathfinding Visualizer.

Routes:
  GET  /            -> serves the visualizer page
  POST /api/solve   -> runs the chosen algorithm on the posted grid and
                        returns the visitation order + shortest path
"""

from flask import Flask, render_template, request, jsonify
from algorithms import ALGORITHMS

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/solve", methods=["POST"])
def solve():
    data = request.get_json(force=True)

    grid = data.get("grid")
    start = data.get("start")
    end = data.get("end")
    algo_name = data.get("algorithm", "dijkstra")

    if grid is None or start is None or end is None:
        return jsonify({"error": "grid, start and end are required"}), 400

    algo_fn = ALGORITHMS.get(algo_name)
    if algo_fn is None:
        return jsonify({"error": f"unknown algorithm '{algo_name}'"}), 400

    start = tuple(start)
    end = tuple(end)

    visited_order, path = algo_fn(grid, start, end)

    return jsonify({
        "visited": [list(n) for n in visited_order],
        "path": [list(n) for n in path],
        "visited_count": len(visited_order),
        "path_length": max(len(path) - 1, 0),
        "found": len(path) > 0,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
