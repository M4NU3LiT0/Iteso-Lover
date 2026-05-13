/**
 * Calculate a compatibility score (0–100) between the current user and another user.
 *
 * Preference match is a hard gate: if either user's gender preference excludes
 * the other, the score is 0 regardless of shared interests.
 *
 * Scoring breakdown (only when preferences are mutually compatible):
 *  - Shared interests → up to 90 pts  (Jaccard similarity × 90)
 *  - Profile richness → up to 10 pts  (bio > 20 chars AND ≥ 2 interests)
 */
const calculateCompatibility = (currentUser, otherUser) => {
  const currentPref = currentUser.preferences?.interestedIn || 'all';
  const otherPref = otherUser.preferences?.interestedIn || 'all';

  const currentLikesOther = currentPref === 'all' || currentPref === otherUser.gender;
  const otherLikesCurrent = otherPref === 'all' || otherPref === currentUser.gender;

  // Hard gate: both preferences must be satisfied — no exceptions
  if (!currentLikesOther || !otherLikesCurrent) return 0;

  let score = 0;

  // ── Interests (Jaccard similarity) ─────────────────────────────────────────
  const setA = new Set(currentUser.interests || []);
  const setB = new Set(otherUser.interests || []);
  const intersection = [...setA].filter((i) => setB.has(i)).length;
  const union = new Set([...setA, ...setB]).size;
  if (union > 0) {
    score += Math.round((intersection / union) * 90);
  }

  // ── Profile richness ───────────────────────────────────────────────────────
  const hasBio = (otherUser.bio?.length || 0) > 20;
  const hasInterests = (otherUser.interests?.length || 0) >= 2;
  if (hasBio && hasInterests) score += 10;

  return Math.min(score, 100);
};

module.exports = { calculateCompatibility };
