import type { GlobalAnalyticsData, LinkRedirectSummary, PaginatedShortLinks } from "@/lib/links";
import type { AdminSettings } from "@/lib/types";

export const sampleLinksPage: PaginatedShortLinks = {
  items: [
    {
      id: "link_1",
      slug: "offer",
      destinationUrl: "https://example.com/offer",
      createdAt: "2026-03-06T10:00:00.000Z",
      updatedAt: "2026-03-06T10:00:00.000Z",
      createdBy: null,
      title: null,
      isFavorite: false,
      tags: ["campaign"],
      redirectType: 302,
      routingRules: [],
      deepLinks: {},
      retargetingScripts: [],
      landingMode: "inherit",
      backgroundUrl: null,
      isActive: true,
      clicksReceived: 0,
      clicksToday: 0,
      lastClickAt: null
    }
  ],
  page: 1,
  pageSize: 20,
  total: 1,
  totalPages: 1
};

export const sampleLinkStats: Record<string, LinkRedirectSummary> = {
  link_1: {
    clicksReceived: 7,
    clicksToday: 2,
    lastClickAt: "2026-03-07T08:15:00.000Z"
  }
};

export const sampleSettings: AdminSettings = {
  plan: "pro",
  clickLimitMonthly: Number.MAX_SAFE_INTEGER,
  trackingEnabled: true,
  landingEnabled: false,
  globalBackgroundUrl: null,
  limitBehavior: "drop",
  usageThisMonth: 0,
  limitReached: false
};

export const emptyGlobalAnalytics: GlobalAnalyticsData = {
  totalLinks: 1,
  clicksLast7Days: 0,
  topLinks: [],
  overview: {
    totalClicks: 0,
    qrScans: 0,
    clicksToday: 0,
    lastClickAt: null,
    uniqueClicks: 0,
    nonUniqueClicks: 0,
    visits: 0,
    landingViews: 0,
    humanClicks: 0,
    redirects: 0,
    directRedirects: 0,
    botHits: 0,
    prefetchHits: 0
  },
  timeseries: {
    hours: [],
    days: [],
    months: []
  },
  worldMap: [],
  topCities: [],
  topRegions: [],
  topDays: [],
  popularHours: [],
  clickType: [],
  topSocialPlatforms: [],
  topSources: [],
  topBrowsers: [],
  topDevices: [],
  topLanguages: [],
  topPlatforms: []
};
