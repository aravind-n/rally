// Persistent memory backed by node:sqlite (built into Node 22.5+).
// Falls back to an in-memory array automatically on older Node versions.

import { randomUUID } from 'crypto';

interface Row { id: string; fact: string; tags: string | null; meeting: string | null; at: number }

// ── Demo seeds — previous incident history ────────────────────────────────────

const SEEDS: Array<{ fact: string; tags: string[]; meeting: string }> = [
  {
    fact: 'November 14 outage: Payments API failed due to DB connection pool exhaustion — pool maxed at 100 connections, fixed by increasing to 500 and restarting app tier, resolved in 52 minutes',
    tags: ['payments', 'outage', 'connection-pool', 'november', 'p0'],
    meeting: 'November 14 Incident Postmortem',
  },
  {
    fact: 'Priya owns the payments service; Alex is primary oncall for infrastructure alerts; Sam covers DB and network',
    tags: ['ownership', 'oncall', 'priya', 'alex', 'sam'],
    meeting: 'Q3 Oncall Rotation Review',
  },
  {
    fact: 'Last three P0 incidents averaged 47 minutes to resolve — connection pool exhaustion is the most common root cause for payments failures',
    tags: ['p0', 'incident', 'payments', 'sla', 'connection-pool'],
    meeting: 'November 14 Incident Postmortem',
  },
];

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
  const month = Date.now() - 30 * 86_400_000;
  for (const s of SEEDS) {
    ins.run(randomUUID(), s.fact, JSON.stringify(s.tags), s.meeting, month);
  }
}

// ── In-memory fallback ────────────────────────────────────────────────────────

declare global { var __rallyMemory: Row[] | undefined }

function getFallback(): Row[] {
  if (!globalThis.__rallyMemory) {
    const month = Date.now() - 30 * 86_400_000;
    globalThis.__rallyMemory = SEEDS.map((s) => ({
      id: randomUUID(),
      fact: s.fact,
      tags: JSON.stringify(s.tags),
      meeting: s.meeting,
      at: month,
    }));
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
      .all(`%${query}%`) as unknown as Row[];
    return rows.map((r) => r.fact);
  }
  const q = query.toLowerCase();
  return getFallback()
    .filter((r) => r.fact.toLowerCase().includes(q))
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)
    .map((r) => r.fact);
}
