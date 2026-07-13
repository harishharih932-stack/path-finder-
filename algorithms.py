"""
algorithms.py
--------------
Core DSA logic for the pathfinding visualizer.

The grid is treated as an implicit graph:
  - each open cell (r, c) is a node
  - 4-directional neighbours (up/down/left/right) are edges of weight 1
  - walls are simply nodes with no outgoing edges

Three classic graph-search algorithms are implemented from scratch:
  - dijkstra(): shortest path via a min-heap priority queue (heapq)
  - bfs():      shortest path (unweighted) via a FIFO queue (collections.deque)
  - astar():    shortest path via a min-heap + Manhattan-distance heuristic

Each function returns:
  visited_order : list of (r, c) in the order the algorithm explored them
  path          : list of (r, c) representing the shortest path found (empty if none)
"""

import heapq
from collections import deque


def neighbors(r, c, rows, cols, grid):
    """Yield walkable 4-directional neighbours of (r, c)."""
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
            yield nr, nc


def reconstruct_path(came_from, start, end):
    """Walk the came_from map backwards from end -> start."""
    if end != start and end not in came_from:
        return []
    path = [end]
    while path[-1] != start:
        path.append(came_from[path[-1]])
    path.reverse()
    return path


def dijkstra(grid, start, end):
    """Shortest path using a min-heap priority queue. O((V+E) log V)."""
    rows, cols = len(grid), len(grid[0])
    dist = {start: 0}
    came_from = {}
    visited_order = []
    visited = set()
    pq = [(0, start)]  # (distance, node)

    while pq:
        d, node = heapq.heappop(pq)
        if node in visited:
            continue
        visited.add(node)
        visited_order.append(node)

        if node == end:
            break

        r, c = node
        for nb in neighbors(r, c, rows, cols, grid):
            new_dist = d + 1
            if new_dist < dist.get(nb, float("inf")):
                dist[nb] = new_dist
                came_from[nb] = node
                heapq.heappush(pq, (new_dist, nb))

    return visited_order, reconstruct_path(came_from, start, end)


def bfs(grid, start, end):
    """Shortest path (unweighted graph) using a FIFO queue. O(V+E)."""
    rows, cols = len(grid), len(grid[0])
    visited_order = []
    came_from = {}
    visited = {start}
    q = deque([start])

    while q:
        node = q.popleft()
        visited_order.append(node)

        if node == end:
            break

        r, c = node
        for nb in neighbors(r, c, rows, cols, grid):
            if nb not in visited:
                visited.add(nb)
                came_from[nb] = node
                q.append(nb)

    return visited_order, reconstruct_path(came_from, start, end)


def heuristic(a, b):
    """Manhattan distance - admissible heuristic for 4-directional grids."""
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def astar(grid, start, end):
    """Shortest path using A* (min-heap + heuristic). O((V+E) log V)."""
    rows, cols = len(grid), len(grid[0])
    g_score = {start: 0}
    came_from = {}
    visited_order = []
    visited = set()
    open_set = [(heuristic(start, end), start)]

    while open_set:
        _, node = heapq.heappop(open_set)
        if node in visited:
            continue
        visited.add(node)
        visited_order.append(node)

        if node == end:
            break

        r, c = node
        for nb in neighbors(r, c, rows, cols, grid):
            tentative = g_score[node] + 1
            if tentative < g_score.get(nb, float("inf")):
                g_score[nb] = tentative
                came_from[nb] = node
                f_score = tentative + heuristic(nb, end)
                heapq.heappush(open_set, (f_score, nb))

    return visited_order, reconstruct_path(came_from, start, end)


ALGORITHMS = {
    "dijkstra": dijkstra,
    "bfs": bfs,
    "astar": astar,
}
