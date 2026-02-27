"use client";

import { useEffect, useState } from "react";
import AdminCharts from "@/components/admin-charts";
import AdminLanguageToggle from "@/components/admin-language-toggle";
import AdminRulesManager from "@/components/admin-rules-manager";
import LogoutButton from "@/components/logout-button";
import type { DashboardData } from "@/lib/analytics";
import { ADMIN_LANG_STORAGE_KEY, normalizeAdminLang, t, type AdminLang } from "@/lib/i18n";
import type { RedirectRule } from "@/lib/types";

interface AdminDashboardClientProps {
  dashboard: DashboardData;
  rules: RedirectRule[];
}

function formatNumber(value: number, lang: AdminLang): string {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US").format(value);
}

export default function AdminDashboardClient({ dashboard, rules }: AdminDashboardClientProps) {
  const [lang, setLang] = useState<AdminLang>("fr");

  useEffect(() => {
    const stored = normalizeAdminLang(window.localStorage.getItem(ADMIN_LANG_STORAGE_KEY));
    setLang(stored);
  }, []);

  function setLanguage(nextLang: AdminLang) {
    setLang(nextLang);
    window.localStorage.setItem(ADMIN_LANG_STORAGE_KEY, nextLang);
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>{t(lang, "adminTitle")}</h1>
          <p>{t(lang, "adminSubtitle")}</p>
        </div>
        <div className="header-actions">
          <AdminLanguageToggle lang={lang} onChange={setLanguage} ariaLabel={t(lang, "languageToggleAria")} />
          <a className="secondary-button" href="/api/admin/export">
            {t(lang, "exportCsv")}
          </a>
          <LogoutButton label={t(lang, "logout")} loadingLabel={t(lang, "signingOut")} />
        </div>
      </header>

      <AdminRulesManager initialRules={rules} lang={lang} />

      <section className="metrics-grid">
        <article className="metric-card">
          <span>{t(lang, "metricTotalClicks")}</span>
          <strong>{formatNumber(dashboard.totalClicks, lang)}</strong>
        </article>
        <article className="metric-card">
          <span>{t(lang, "metricUniqueSlugs")}</span>
          <strong>{formatNumber(dashboard.clicksBySlug.length, lang)}</strong>
        </article>
        <article className="metric-card">
          <span>{t(lang, "metricTopReferer")}</span>
          <strong>{dashboard.topReferers[0]?.label ?? t(lang, "fallbackDirect")}</strong>
        </article>
        <article className="metric-card">
          <span>{t(lang, "metricTopCountry")}</span>
          <strong>{dashboard.topCountries[0]?.label ?? t(lang, "fallbackUnknownCountry")}</strong>
        </article>
      </section>

      <AdminCharts
        lang={lang}
        daily7={dashboard.daily7}
        daily30={dashboard.daily30}
        hourly={dashboard.hourly}
        topDevices={dashboard.topDevices}
        topCountries={dashboard.topCountries}
      />

      <section className="tables-grid">
        <article className="card">
          <h3>{t(lang, "tableClicksBySlugTitle")}</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t(lang, "colSlug")}</th>
                <th>{t(lang, "colClicks")}</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.clicksBySlug.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>{formatNumber(item.clicks, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="card">
          <h3>{t(lang, "tableTopReferersTitle")}</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t(lang, "colReferer")}</th>
                <th>{t(lang, "colClicks")}</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.topReferers.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>{formatNumber(item.clicks, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}
