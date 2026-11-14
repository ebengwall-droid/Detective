// Collision and pathfinding for one room.
//
// Rooms are small and their obstacles are axis-aligned boxes, so collision is
// a circle-against-rectangles test and pathfinding is A* over a coarse grid.
// The grid is what makes "tap a thing and walk to it" work on a phone.

const CELL = 0.2;

export class Nav {
  /**
   * @param {{ bounds: {minX:number,maxX:number,minZ:number,maxZ:number}|null, round: {r:number}|null,
   *           colliders: {minX:number,maxX:number,minZ:number,maxZ:number}[] }} room
   * @param {number} [radius] the walker's body radius
   */
  constructor(room, radius = 0.3) {
    this.room = room;
    this.radius = radius;
    const b = room.bounds ?? { minX: -room.round.r - 0.5, maxX: room.round.r + 0.5, minZ: -room.round.r - 0.5, maxZ: room.round.r + 0.5 };
    this.minX = b.minX;
    this.minZ = b.minZ;
    this.cols = Math.max(1, Math.ceil((b.maxX - b.minX) / CELL));
    this.rows = Math.max(1, Math.ceil((b.maxZ - b.minZ) / CELL));
    this.blocked = new Uint8Array(this.cols * this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const [x, z] = this.cellCentre(c, r);
        this.blocked[r * this.cols + c] = this.isFree(x, z) ? 0 : 1;
      }
    }
  }

  cellCentre(c, r) {
    return [this.minX + (c + 0.5) * CELL, this.minZ + (r + 0.5) * CELL];
  }

  cellOf(x, z) {
    return [
      Math.max(0, Math.min(this.cols - 1, Math.floor((x - this.minX) / CELL))),
      Math.max(0, Math.min(this.rows - 1, Math.floor((z - this.minZ) / CELL))),
    ];
  }

  /** Can a body of this.radius stand at (x, z)? */
  isFree(x, z, radius = this.radius) {
    const { bounds, round, colliders } = this.room;
    if (round) {
      if (Math.hypot(x, z) > round.r - radius + 0.3) return false;
    } else if (x < bounds.minX + radius || x > bounds.maxX - radius || z < bounds.minZ + radius || z > bounds.maxZ - radius) {
      return false;
    }
    for (const c of colliders) {
      if (x > c.minX - radius && x < c.maxX + radius && z > c.minZ - radius && z < c.maxZ + radius) return false;
    }
    return true;
  }

  /** Move by (dx, dz), sliding along whatever is in the way. Mutates pos. */
  move(pos, dx, dz) {
    if (this.isFree(pos.x + dx, pos.z + dz)) {
      pos.x += dx;
      pos.z += dz;
      return true;
    }
    let moved = false;
    if (dx && this.isFree(pos.x + dx, pos.z)) {
      pos.x += dx;
      moved = true;
    }
    if (dz && this.isFree(pos.x, pos.z + dz)) {
      pos.z += dz;
      moved = true;
    }
    return moved;
  }

  /** Nearest free cell centre to a point, searched in growing rings. */
  nearestFree(x, z, maxRings = 14) {
    const [c0, r0] = this.cellOf(x, z);
    if (!this.blocked[r0 * this.cols + c0] && this.isFree(x, z)) return { x, z };
    let best = null;
    let bestD = Infinity;
    for (let ring = 1; ring <= maxRings && !best; ring++) {
      for (let dr = -ring; dr <= ring; dr++) {
        for (let dc = -ring; dc <= ring; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue;
          const c = c0 + dc;
          const r = r0 + dr;
          if (c < 0 || r < 0 || c >= this.cols || r >= this.rows || this.blocked[r * this.cols + c]) continue;
          const [cx, cz] = this.cellCentre(c, r);
          const d = Math.hypot(cx - x, cz - z);
          if (d < bestD) {
            bestD = d;
            best = { x: cx, z: cz };
          }
        }
      }
    }
    return best;
  }

  lineFree(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az);
    const n = Math.ceil(d / 0.12);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (!this.isFree(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
    }
    return true;
  }

  /**
   * A* from `from` to within `reach` metres of `to`.
   * @returns {{x:number,z:number}[] | null} waypoints (not including the start), or null if unreachable
   */
  findPath(from, to, reach = 0) {
    const start = this.nearestFree(from.x, from.z);
    if (!start) return null;
    if (Math.hypot(start.x - to.x, start.z - to.z) <= reach && this.isFree(start.x, start.z)) return [];
    // With no reach, aim for the nearest standable spot to the target.
    let goal = to;
    if (reach <= 0) {
      const g = this.nearestFree(to.x, to.z);
      if (!g) return null;
      goal = g;
      reach = CELL * 0.75;
    }
    const [sc, sr] = this.cellOf(start.x, start.z);
    const n = this.cols * this.rows;
    const g = new Float32Array(n).fill(Infinity);
    const came = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const heap = new Heap();
    const h = (c, r) => {
      const [x, z] = this.cellCentre(c, r);
      return Math.max(0, Math.hypot(x - goal.x, z - goal.z) - reach);
    };
    const s = sr * this.cols + sc;
    g[s] = 0;
    heap.push(s, h(sc, sr));
    let found = -1;
    let guard = 0;
    while (heap.size && guard++ < 20000) {
      const cur = heap.pop();
      if (closed[cur]) continue;
      closed[cur] = 1;
      const c = cur % this.cols;
      const r = (cur - c) / this.cols;
      const [x, z] = this.cellCentre(c, r);
      if (Math.hypot(x - goal.x, z - goal.z) <= reach) {
        found = cur;
        break;
      }
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nc = c + dc;
          const nr = r + dr;
          if (nc < 0 || nr < 0 || nc >= this.cols || nr >= this.rows) continue;
          const ni = nr * this.cols + nc;
          if (closed[ni] || this.blocked[ni]) continue;
          // No cutting corners between two blocked cells.
          if (dr && dc && (this.blocked[r * this.cols + nc] || this.blocked[nr * this.cols + c])) continue;
          const cost = g[cur] + (dr && dc ? 1.4142 : 1);
          if (cost < g[ni]) {
            g[ni] = cost;
            came[ni] = cur;
            heap.push(ni, cost + h(nc, nr) / CELL);
          }
        }
      }
    }
    if (found < 0) return null;
    const cells = [];
    for (let i = found; i !== -1 && i !== s; i = came[i]) cells.push(i);
    cells.reverse();
    const pts = cells.map((i) => {
      const c = i % this.cols;
      const [x, z] = this.cellCentre(c, (i - c) / this.cols);
      return { x, z };
    });
    // String-pull: drop every waypoint that can be skipped in a straight line.
    const out = [];
    let anchor = start;
    let i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !this.lineFree(anchor.x, anchor.z, pts[j].x, pts[j].z)) j--;
      out.push(pts[j]);
      anchor = pts[j];
      i = j + 1;
    }
    return out;
  }
}

/** Minimal binary min-heap keyed by priority. */
class Heap {
  constructor() {
    this.items = [];
    this.keys = [];
  }

  get size() {
    return this.items.length;
  }

  push(item, key) {
    const { items, keys } = this;
    let i = items.length;
    items.push(item);
    keys.push(key);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p] <= keys[i]) break;
      [items[p], items[i]] = [items[i], items[p]];
      [keys[p], keys[i]] = [keys[i], keys[p]];
      i = p;
    }
  }

  pop() {
    const { items, keys } = this;
    const top = items[0];
    const lastItem = items.pop();
    const lastKey = keys.pop();
    if (items.length) {
      items[0] = lastItem;
      keys[0] = lastKey;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < items.length && keys[l] < keys[m]) m = l;
        if (r < items.length && keys[r] < keys[m]) m = r;
        if (m === i) break;
        [items[m], items[i]] = [items[i], items[m]];
        [keys[m], keys[i]] = [keys[i], keys[m]];
        i = m;
      }
    }
    return top;
  }
}
