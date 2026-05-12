/**
 * Calculate a compatibility score (0–100) between the current user and another user.
 *
 * Scoring breakdown:
 *  - Shared interests  → up to 60 pts  (Jaccard similarity × 60)
 *  - Gender preference → up to 30 pts  (both users' preferences satisfied = 30, one-way = 15)
 *  - Profile richness  → up to 10 pts  (bio > 20 chars AND ≥ 2 interests)
 */
const calculateCompatibility = (currentUser, otherUser) => {
  let score = 0;

  // ── Interests (Jaccard similarity) ─────────────────────────────────────────
  const setA = new Set(currentUser.interests || []);
  const setB = new Set(otherUser.interests || []);
  const intersection = [...setA].filter((i) => setB.has(i)).length;
  const union = new Set([...setA, ...setB]).size;
  if (union > 0) {
    score += Math.round((intersection / union) * 60);
  }

  // ── Gender preference match ────────────────────────────────────────────────
  const currentPref = currentUser.preferences?.interestedIn || 'all';
  const otherPref = otherUser.preferences?.interestedIn || 'all';

  const currentLikesOther = currentPref === 'all' || currentPref === otherUser.gender;
  const otherLikesCurrent = otherPref === 'all' || otherPref === currentUser.gender;

  if (currentLikesOther && otherLikesCurrent) score += 30;
  else if (currentLikesOther || otherLikesCurrent) score += 15;

  // ── Profile richness ───────────────────────────────────────────────────────
  const hasBio = (otherUser.bio?.length || 0) > 20;
  const hasInterests = (otherUser.interests?.length || 0) >= 2;
  if (hasBio && hasInterests) score += 10;

  return Math.min(score, 100);
};

module.exports = { calculateCompatibility };
