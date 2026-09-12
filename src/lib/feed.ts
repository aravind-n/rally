import type { ActionCard } from './contract';

// Persist across Next.js hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __rallyFeed: ActionCard[] | undefined;
}

globalThis.__rallyFeed ??= [];

export const feed: ActionCard[] = globalThis.__rallyFeed;

export function pushCard(card: ActionCard): void {
  const idx = feed.findIndex((c) => c.id === card.id);
  if (idx >= 0) {
    feed[idx] = card;
  } else {
    feed.push(card);
  }
}

export function getCards(): ActionCard[] {
  return [...feed].sort((a, b) => b.at - a.at);
}

export function updateCard(id: string, patch: Partial<ActionCard>): void {
  const idx = feed.findIndex((c) => c.id === id);
  if (idx >= 0) {
    feed[idx] = { ...feed[idx], ...patch };
  }
}
