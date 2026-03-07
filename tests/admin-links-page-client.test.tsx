// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminLinksPageClient from "@/components/admin-links-page-client";
import { emptyGlobalAnalytics, sampleLinksPage, sampleSettings } from "@/tests/test-data";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    prefetch: _prefetch,
    ...props
  }: {
    href: string;
    children: ReactNode;
    prefetch?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/components/admin-charts", () => ({
  default: () => <div data-testid="admin-charts" />
}));

vi.mock("@/components/chart-error-boundary", () => ({
  default: ({ children }: { children: ReactNode }) => children
}));

vi.mock("@/components/admin-language-toggle", () => ({
  default: () => <button type="button">lang</button>
}));

vi.mock("@/components/logout-button", () => ({
  default: () => <button type="button">logout</button>
}));

vi.mock("@/components/top-toast", () => ({
  default: () => null
}));

describe("AdminLinksPageClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          stats: {},
          statsFallback: true
        })
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders link rows and a non-blocking warning when stats are unavailable", async () => {
    render(
      <AdminLinksPageClient
        initialLinks={sampleLinksPage}
        initialLinkStatsFallback={true}
        initialGlobalAnalytics={emptyGlobalAnalytics}
        initialGlobalAnalyticsLoaded={false}
        initialSettings={sampleSettings}
      />
    );

    expect(screen.getByText("/offer")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/offer")).toBeInTheDocument();
    expect(screen.getByText("Certaines statistiques n'ont pas pu etre chargees.")).toBeInTheDocument();
    expect(screen.queryByText("Aucun lien pour le moment.")).not.toBeInTheDocument();

    expect(screen.getByText("Indisponible")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
