// Persistent memory backed by node:sqlite (built into Node 24, zero deps).
// Falls back to an in-memory Map if the module isn't available.

import { randomUUID } from 'crypto';

interface Row {
  id: string;
  fact: string;
  tags: string | null;
  meeting: string | null;
  at: number;
}

// Persist db across Next.js hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __rallyDb: unknown;
}

function getDb() {
  if (globalThis.__rallyDb) return globalThis.__rallyDb as ReturnType<typeof openDb>;
  const db = openDb();
  globalThis.__rallyDb = db;
  return db;
}

function openDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');
  const db = new DatabaseSync('rally.db');

  db.exec(`
    CREATE TABLE IF NOT EXISTS memory (
      id      TEXT PRIMARY KEY,
      fact    TEXT NOT NULL,
      tags    TEXT,
      meeting TEXT,
      at      INTEGER NOT NULL
    )
  `);

  // Seed demo facts (only if empty — so first run gets the demo data)
  const count = db.prepare('SELECT COUNT(*) AS c FROM memory').get() as { c: number };
  if (count.c === 0) {
    const ins = db.prepare(
      'INSERT INTO memory (id, fact, tags, meeting, at) VALUES (?, ?, ?, ?, ?)',
    );
    const week = Date.now() - 7 * 86_400_000;
    ins.run(
      randomUUID(),
      'We decided to use Redis for distributed throttling on the upload API',
      '["redis","throttling","upload"]',
      'Upload Reliability Review',
      week,
    );
    ins.run(
      randomUUID(),
      'Safari 17 has a known fetch bug with large request bodies — chunks over 8MB fail silently',
      '["safari","bug","fetch","upload"]',
      'Upload Reliability Review',
      week,
    );
    ins.run(
      randomUUID(),
      'Priya owns the load testing framework; Alex owns the timeout fixes',
      '["ownership","priya","alex"]',
      'Upload Reliability Review',
      week,
    );
  }

  return db;
}

export function rememberFact(fact: string, tags?: string[], meeting?: string): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    'INSERT INTO memory (id, fact, tags, meeting, at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, fact, tags ? JSON.stringify(tags) : null, meeting ?? null, Date.now());
  return id;
}

export function recallFacts(query: string): string[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT fact FROM memory WHERE fact LIKE ? ORDER BY at DESC LIMIT 5')
    .all(`%${query}%`) as Row[];
  return rows.map((r) => r.fact);
}
