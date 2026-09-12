// Persistent memory backed by node:sqlite (built into Node 22.5+).
// Falls back to an in-memory array automatically on older Node versions.

import { randomUUID } from 'crypto';

interface Row { id: string; fact: string; tags: string | null; meeting: string | null; at: number }

// ── SQLite path ───────────────────────────────────────────────────────────────

declare global { var __rallyDb: unknown }

function openDb() {
  try {
    const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');
    const db = new DatabaseSync('rally.db');
    db.exec(`CREATE TABLE IF NOT EXISTS memory (
      id TEXT PRIMARY KEY, fact TEXT NOT NULL,
      tags TEXT, meeting TEXT, at INTEGER NOT NULL
    )`);
    seedIfEmpty(db);
    return db;
  } catch {
    return null;
  }
}

function getDb() {
  if (globalThis.__rallyDb !== undefined) return globalThis.__rallyDb as ReturnType<typeof openDb>;
  const db = openDb();
  globalThis.__rallyDb = db;
  return db;
}

function seedIfEmpty(db: NonNullable<ReturnType<typeof openDb>>) {
  const count = db!.prepare('SELECT COUNT(*) AS c FROM memory').get() as { c: number };
  if (count.c > 0) return;
  const ins = db!.prepare('INSERT INTO memory (id, fact, tags, meeting, at) VALUES (?, ?, ?, ?, ?)');
  const week = Date.now() - 7 * 86_400_000;
  ins.run(randomUUID(), 'We decided to use Redis for distributed throttling on the upload API',
    '["redis","throttling","upload"]', 'Upload Reliability Review', week);
  ins.run(randomUUID(), 'Safari 17 has a known fetch bug with large request bodies — chunks over 8MB fail silently',
    '["safari","bug","fetch","upload"]', 'Upload Reliability Review', week);
  ins.run(randomUUID(), 'Priya owns the load testing framework; Alex owns the timeout fixes',
    '["ownership","priya","alex"]', 'Upload Reliability Review', week);
}

// ── In-memory fallback ────────────────────────────────────────────────────────

declare global { var __rallyMemory: Row[] | undefined }

function getFallback(): Row[] {
  if (!globalThis.__rallyMemory) {
    const week = Date.now() - 7 * 86_400_000;
    globalThis.__rallyMemory = [
      { id: randomUUID(), fact: 'We decided to use Redis for distributed throttling on the upload API',
        tags: '["redis","throttling","upload"]', meeting: 'Upload Reliability Review', at: week },
      { id: randomUUID(), fact: 'Safari 17 has a known fetch bug with large request bodies — chunks over 8MB fail silently',
        tags: '["safari","bug","fetch","upload"]', meeting: 'Upload Reliability Review', at: week },
      { id: randomUUID(), fact: 'Priya owns the load testing framework; Alex owns the timeout fixes',
        tags: '["ownership","priya","alex"]', meeting: 'Upload Reliability Review', at: week },
    ];
  }
  return globalThis.__rallyMemory;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function rememberFact(fact: string, tags?: string[], meeting?: string): string {
  const id = randomUUID();
  const db = getDb();
  if (db) {
    db.prepare('INSERT INTO memory (id, fact, tags, meeting, at) VALUES (?, ?, ?, ?, ?)')
      .run(id, fact, tags ? JSON.stringify(tags) : null, meeting ?? null, Date.now());
  } else {
    getFallback().push({ id, fact, tags: tags ? JSON.stringify(tags) : null, meeting: meeting ?? null, at: Date.now() });
  }
  return id;
}

export function recallFacts(query: string): string[] {
  const db = getDb();
  if (db) {
    const rows = db.prepare('SELECT fact FROM memory WHERE fact LIKE ? ORDER BY at DESC LIMIT 5')
      .all(`%${query}%`) as Row[];
    return rows.map((r) => r.fact);
  }
  const q = query.toLowerCase();
  return getFallback()
    .filter((r) => r.fact.toLowerCase().includes(q))
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)
    .map((r) => r.fact);
}
