import type {
  CustomerPreferences,
  InventoryItem,
  ScoredRecommendation,
} from "@/lib/types";

const AVAILABLE_STATUSES = new Set(["in_stock", "low_stock"]);

function distanceScore(actual: number | null, desired?: number) {
  if (actual == null || desired == null) return 0;
  return Math.max(0, 1 - Math.abs(actual - desired) / 9);
}

export function scoreInventory(
  inventory: InventoryItem[],
  preferences: CustomerPreferences,
): ScoredRecommendation[] {
  return inventory
    .filter(
      (item) =>
        AVAILABLE_STATUSES.has(item.stock_status) && item.product.active,
    )
    .map((item) => {
      let score = 0;
      const reasons: string[] = [];
      const product = item.product;

      if (
        product.flavor_family &&
        preferences.flavorFamilies.some(
          (flavor) =>
            flavor.toLowerCase() === product.flavor_family?.toLowerCase(),
        )
      ) {
        score += 36;
        reasons.push(`matches your ${product.flavor_family.toLowerCase()} preference`);
      }

      const cooling = distanceScore(product.cooling_level, preferences.cooling);
      const strength = distanceScore(
        product.hit_strength,
        preferences.strength,
      );
      score += cooling * 17 + strength * 17;
      if (cooling >= 0.78) reasons.push("has the cooling level you chose");
      if (strength >= 0.78) reasons.push("is close to your preferred strength");

      const price = item.sale_price ?? item.price;
      if (price != null && preferences.budgetMax != null) {
        if (
          price <= preferences.budgetMax &&
          price >= (preferences.budgetMin ?? 0)
        ) {
          score += 16;
          reasons.push("fits your budget");
        } else if (price > preferences.budgetMax) {
          score -= Math.min(16, price - preferences.budgetMax);
        }
      }

      if (preferences.desiredPuffCount && product.puff_count) {
        const ratio =
          Math.min(preferences.desiredPuffCount, product.puff_count) /
          Math.max(preferences.desiredPuffCount, product.puff_count);
        score += ratio * 8;
      }

      // Merchandising signals are intentionally capped below preference signals.
      score += Math.min(5, Math.max(-5, item.recommendation_priority));
      if (item.staff_pick) score += 3;
      if (item.featured) score += 2;
      if (item.stock_status === "low_stock") score -= 2;

      return {
        item,
        score: Math.round(Math.max(0, score) * 10) / 10,
        reasons: reasons.slice(0, 3),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function topRecommendations(
  inventory: InventoryItem[],
  preferences: CustomerPreferences,
) {
  return scoreInventory(inventory, preferences).slice(0, 3);
}
