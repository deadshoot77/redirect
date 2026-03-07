import {
  getLinksRedirectSummariesBatch,
  listShortLinksPage,
  type LinkRedirectSummary,
  type LinkRedirectSummariesResult,
  type PaginatedShortLinks
} from "@/lib/links";

const ADMIN_LINK_STATS_TIMEOUT_MS = 2_500;

export interface AdminLinksPageDataResult {
  links: PaginatedShortLinks;
  linkStatsFallback: boolean;
}

interface LoadAdminLinksPageDataOptions {
  timeZone?: string;
  statsTimeoutMs?: number;
  listPage?: typeof listShortLinksPage;
  getStats?: typeof getLinksRedirectSummariesBatch;
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);

    operation
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function normalizeLinkRedirectSummary(summary?: Partial<LinkRedirectSummary> | null): LinkRedirectSummary {
  return {
    clicksReceived: Number.isFinite(Number(summary?.clicksReceived)) ? Number(summary?.clicksReceived) : 0,
    clicksToday: Number.isFinite(Number(summary?.clicksToday)) ? Number(summary?.clicksToday) : 0,
    lastClickAt: typeof summary?.lastClickAt === "string" && summary.lastClickAt.length > 0 ? summary.lastClickAt : null
  };
}

export function enrichPaginatedShortLinksWithStats(
  links: PaginatedShortLinks,
  statsByLinkId?: Record<string, Partial<LinkRedirectSummary>> | null
): PaginatedShortLinks {
  return {
    ...links,
    items: links.items.map((link) => {
      const stats = normalizeLinkRedirectSummary(statsByLinkId?.[link.id]);
      return {
        ...link,
        clicksReceived: stats.clicksReceived,
        clicksToday: stats.clicksToday,
        lastClickAt: stats.lastClickAt
      };
    })
  };
}

export async function loadAdminLinksPageData(
  page = 1,
  pageSize = 20,
  options?: LoadAdminLinksPageDataOptions
): Promise<AdminLinksPageDataResult> {
  const listPage = options?.listPage ?? listShortLinksPage;
  const getStats = options?.getStats ?? getLinksRedirectSummariesBatch;
  const links = await listPage(page, pageSize);

  if (links.items.length === 0) {
    return {
      links,
      linkStatsFallback: false
    };
  }

  try {
    const statsResult = await withTimeout<LinkRedirectSummariesResult>(
      getStats(
        links.items.map((link) => link.id),
        options?.timeZone
      ),
      options?.statsTimeoutMs ?? ADMIN_LINK_STATS_TIMEOUT_MS,
      "getLinksRedirectSummariesBatch"
    );

    if (statsResult.fallback) {
      console.error("loadAdminLinksPageData partial stats fallback", {
        page: links.page,
        pageSize: links.pageSize,
        timeZone: options?.timeZone ?? "default"
      });
    }

    return {
      links: enrichPaginatedShortLinksWithStats(links, statsResult.stats),
      linkStatsFallback: statsResult.fallback
    };
  } catch (error) {
    console.error("loadAdminLinksPageData stats fallback", {
      page: links.page,
      pageSize: links.pageSize,
      timeZone: options?.timeZone ?? "default",
      error: error instanceof Error ? error.message : error
    });

    return {
      links: enrichPaginatedShortLinksWithStats(links),
      linkStatsFallback: true
    };
  }
}
