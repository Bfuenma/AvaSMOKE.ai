import { describe, expect, it } from "vitest";

import { developmentInventory, developmentShop } from "@/lib/development-data";
import { haversineMiles, verifyRadius } from "@/lib/location";
import { scoreInventory, topRecommendations } from "@/lib/recommendations";

describe("location verification", () => {
  it("returns zero at the store coordinates", () => {
    expect(
      haversineMiles(
        {
          latitude: developmentShop.latitude,
          longitude: developmentShop.longitude,
        },
        {
          latitude: developmentShop.latitude,
          longitude: developmentShop.longitude,
        },
      ),
    ).toBe(0);
  });

  it("blocks a customer outside the configured radius", () => {
    const result = verifyRadius(
      { latitude: 41.8781, longitude: -87.6298 },
      {
        latitude: developmentShop.latitude,
        longitude: developmentShop.longitude,
      },
      0.25,
    );
    expect(result.verified).toBe(false);
    expect(result.distanceMiles).toBeGreaterThan(0.25);
  });
});

describe("store-grounded recommendation scoring", () => {
  it("never returns inactive, hidden, or out-of-stock inventory", () => {
    const disallowed = [
      {
        ...developmentInventory[0],
        id: "hidden",
        stock_status: "hidden" as const,
      },
      {
        ...developmentInventory[1],
        id: "out",
        stock_status: "out_of_stock" as const,
      },
      {
        ...developmentInventory[2],
        id: "inactive",
        product: { ...developmentInventory[2].product, active: false },
      },
    ];
    expect(
      scoreInventory(disallowed, { flavorFamilies: ["Fruity"] }),
    ).toHaveLength(0);
  });

  it("prioritizes customer preference over merchandising priority", () => {
    const fruity = {
      ...developmentInventory[1],
      recommendation_priority: 0,
    };
    const tobacco = {
      ...developmentInventory[4],
      recommendation_priority: 10,
      featured: true,
      staff_pick: true,
    };
    const result = scoreInventory([tobacco, fruity], {
      flavorFamilies: ["Fruity"],
      cooling: 4,
      strength: 5,
    });
    expect(result[0].item.id).toBe(fruity.id);
  });

  it("returns no more than three primary recommendations", () => {
    expect(
      topRecommendations(developmentInventory, {
        flavorFamilies: ["Tropical", "Fruity"],
      }),
    ).toHaveLength(3);
  });
});
