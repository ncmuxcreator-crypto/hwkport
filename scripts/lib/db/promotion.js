export function isPromotionReady(promotion = {}) {
  return Boolean(promotion.ready_to_promote || promotion.promoted);
}
