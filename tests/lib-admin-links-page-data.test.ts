import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleLinkStats, sampleLinksPage } from "@/tests/test-data";

vi.mock("@/lib/links", () => ({
  listShortLinksPage: vi.fn(),
  getLinksRedirectSummariesBatch: vi.fn()
}));

import { enrichPaginatedShortLinksWithStats, loadAdminLinksPageData } from "@/lib/admin-links-page-data";

describe("admin links page data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enriches links with real stats when available", () => {
    const enriched = enrichPaginatedShortLinksWithStats(sampleLinksPage, sampleLinkStats);

    expect(enriched.items).toHaveLength(1);
    expect(enriched.items[0].clicksReceived).toBe(7);
    expect(enriched.items[0].clicksToday).toBe(2);
  });

  it("keeps links visible with fallback stats when stats are missing", () => {
    const enriched = enrichPaginatedShortLinksWithStats(sampleLinksPage, undefined);

    expect(enriched.items).toHaveLength(1);
    expect(enriched.items[0].slug).toBe("offer");
    expect(enriched.items[0].clicksReceived).toBe(0);
    expect(enriched.items[0].clicksToday).toBe(0);
  });

  it("returns links and a fallback flag when stats provider times out", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const result = await loadAdminLinksPageData(1, 20, {
      listPage: vi.fn().mockResolvedValue(sampleLinksPage),
      getStats: vi
        .fn()
        .mockRejectedValue(new Error("scanClickEvents failed: canceling statement due to statement timeout"))
    });

    expect(result.linkStatsFallback).toBe(true);
    expect(result.links.items).toHaveLength(1);
    expect(result.links.items[0].slug).toBe("offer");
    expect(result.links.items[0].clicksReceived).toBe(0);
    expect(consoleError).toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
  });
});
