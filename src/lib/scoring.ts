// Locked scoring formula — mirrors what the Anchor program computes on-chain.
// Score is normalized 0..100 per weighted criterion. Lower price = better,
// lower timelineDays = better. Quality is a self-reported certification tier
// mapped to a 0..1 score (MVP only — not independently verified).
import type { Bid, Tender } from "./types";

const CERT_TIER: Record<string, number> = {
  "ISO 9001": 1.0,
  "ISO 14001": 0.9,
  "ISO 27001": 0.9,
  "NS Certified": 0.8,
  "Government Registered": 0.7,
  "Self-Declared": 0.4,
  "": 0.2,
};

function qualityToScore(cert: string): number {
  if (!cert) return CERT_TIER[""];
  for (const key of Object.keys(CERT_TIER)) {
    if (cert.toLowerCase().includes(key.toLowerCase())) return CERT_TIER[key];
  }
  return 0.5;
}

export function computeScores(tender: Tender, bids: Bid[]): Bid[] {
  if (bids.length === 0) return [];
  const prices = bids.map((b) => b.price);
  const timelines = bids.map((b) => b.timelineDays);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minTimeline = Math.min(...timelines);
  const maxTimeline = Math.max(...timelines);

  const priceRange = maxPrice - minPrice || 1;
  const timelineRange = maxTimeline - minTimeline || 1;

  return bids.map((b) => {
    const priceScore = 1 - (b.price - minPrice) / priceRange;
    const timelineScore = 1 - (b.timelineDays - minTimeline) / timelineRange;
    const qualityScore = qualityToScore(b.qualityCert);
    const total =
      (tender.priceWeight / 100) * priceScore * 100 +
      (tender.timelineWeight / 100) * timelineScore * 100 +
      (tender.qualityWeight / 100) * qualityScore * 100;
    return { ...b, score: Math.round(total * 100) / 100 };
  });
}

export function pickWinner(scored: Bid[]): Bid | null {
  if (scored.length === 0) return null;
  return [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
}
