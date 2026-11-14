// Save games on disk, one JSON file per session id.

import fs from 'node:fs/promises';
import path from 'node:path';

export class SaveStore {
  /** @param {string} dir */
  constructor(dir) {
    this.dir = dir;
    this.ready = fs.mkdir(dir, { recursive: true }).catch(() => {});
  }

  file(sid) {
    return path.join(this.dir, `${sid}.json`);
  }

  /** @returns {Promise<object|null>} */
  async load(sid) {
    await this.ready;
    try {
      return JSON.parse(await fs.readFile(this.file(sid), 'utf8'));
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`Could not read save ${sid}:`, err.message);
      return null;
    }
  }

  async save(sid, state) {
    await this.ready;
    const tmp = this.file(sid) + '.tmp';
    try {
      // Write-then-rename so a crash mid-write cannot corrupt an existing save.
      await fs.writeFile(tmp, JSON.stringify(state));
      await fs.rename(tmp, this.file(sid));
    } catch (err) {
      console.warn(`Could not write save ${sid}:`, err.message);
    }
  }
}
