import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyGlobalAnalytics, sampleLinkStats, sampleLinksPage, sampleSettings } from "@/tests/test-data";

const {
  isAdminRequest,
  loadAdminLinksPageData,
  createShortLink,
  getAdminSettings,
  getGlobalAnalyticsData,
  createEmptyGlobalAnalyticsData
} = vi.hoisted(() => ({
  isAdminRequest: vi.fn(),
  loadAdminLinksPageData: vi.fn(),
  createShortLink: vi.fn(),
  getAdminSettings: vi.fn(),
  getGlobalAnalyticsData: vi.fn(),
  createEmptyGlobalAnalyticsData: vi.fn(() => emptyGlobalAnalytics)
}));

vi.mock("@/lib/auth", () => ({
  isAdminRequest
}));

vi.mock("@/lib/admin-links-page-data", () => ({
  loadAdminLinksPageData
}));

vi.mock("@/lib/links", () => ({
  createEmptyGlobalAnalyticsData,
  createShortLink,
  getAdminSettings,
  getGlobalAnalyticsData
}));

import { GET } from "@/app/api/admin/links/route";

function createRequest(url: string) {
  return {
    nextUrl: new URL(url),
    cookies: {
      get: vi.fn()
    }
  };
}

describe("/api/admin/links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAdminRequest.mockResolvedValue(true);
    getAdminSettings.mockResolvedValue(sampleSettings);
  });

  it("returns links with stats when the stats provider succeeds", async () => {
    loadAdminLinksPageData.mockResolvedValue({
      links: {
        ...sampleLinksPage,
        items: sampleLinksPage.items.map((link) => ({
          ...link,
          ...sampleLinkStats[link.id]
        }))
      },
      linkStatsFallback: false
    });

    const response = await GET(createRequest("http://localhost/api/admin/links?page=1&pageSize=20") as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(loadAdminLinksPageData).toHaveBeenCalledWith(1, 20, { timeZone: undefined });
    expect(payload.links.items).toHaveLength(1);
    expect(payload.links.items[0].clicksReceived).toBe(7);
    expect(payload.linkStatsFallback).toBe(false);
  });

  it("keeps links visible and marks fallback when stats loading fails", async () => {
    loadAdminLinksPageData.mockResolvedValue({
      links: sampleLinksPage,
      linkStatsFallback: true
    });

    const response = await GET(createRequest("http://localhost/api/admin/links?page=1&pageSize=20") as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.links.items).toHaveLength(1);
    expect(payload.links.items[0].slug).toBe("offer");
    expect(payload.linkStatsFallback).toBe(true);
  });
});
