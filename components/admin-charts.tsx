"use client";

import { useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import type { DailyPoint, HourlyPoint, LabelCount as LegacyLabelCount } from "@/lib/analytics";
import type { AdminLang } from "@/lib/i18n";
import type { AnalyticsGranularity, LinkOverviewStats, TimeSeriesPoint } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface LabelCount {
  label: string;
  clicks: number;
}

interface LegacyChartsProps {
  mode?: "legacy";
  lang: AdminLang;
  daily7: DailyPoint[];
  daily30: DailyPoint[];
  hourly: HourlyPoint[];
  topDevices: LegacyLabelCount[];
  topCountries: LegacyLabelCount[];
}

interface RebrandlyChartsProps {
  mode: "rebrandly";
  lang: AdminLang;
  overview: LinkOverviewStats;
  timeseries: {
    hours: TimeSeriesPoint[];
    days: TimeSeriesPoint[];
    months: TimeSeriesPoint[];
  };
  worldMap: LabelCount[];
  topCities: LabelCount[];
  topRegions: LabelCount[];
  topDays: LabelCount[];
  popularHours: LabelCount[];
  clickType: LabelCount[];
  topSocialPlatforms: LabelCount[];
  topSources: LabelCount[];
  topBrowsers: LabelCount[];
  topDevices: LabelCount[];
  topLanguages: LabelCount[];
  topPlatforms: LabelCount[];
}

type AdminChartsProps = LegacyChartsProps | RebrandlyChartsProps;

const rebrandlyWords = {
  fr: {
    noData: "Pas de donnees",
    clicks: "Clics",
    overallPerformance: "Performance generale",
    trackClicks: "Suivi des clics par periode",
    hours: "Heures",
    days: "Jours",
    months: "Mois",
    totalClicks: "Clics totaux",
    qrScans: "Scans QR",
    clicksToday: "Clics aujourd'hui",
    lastClick: "Dernier clic",
    noLastClick: "Aucune donnee",
    geoDistribution: "Repartition geographique",
    clickType: "Type de clic",
    topCities: "Top villes",
    topRegions: "Top regions",
    topDays: "Top jours",
    popularHours: "Heures populaires",
    topSocial: "Top plateformes sociales",
    topSources: "Top sources",
    topBrowsers: "Top navigateurs",
    topDevices: "Top appareils",
    topLanguages: "Top langues",
    topPlatforms: "Top plateformes"
  },
  en: {
    noData: "No data yet.",
    clicks: "Clicks",
    overallPerformance: "Overall performance",
    trackClicks: "Track clicks by time range",
    hours: "Hours",
    days: "Days",
    months: "Months",
    totalClicks: "Total clicks",
    qrScans: "QR scans",
    clicksToday: "Clicks today",
    lastClick: "Last click",
    noLastClick: "No data",
    geoDistribution: "Geographic distribution",
    clickType: "Click type",
    topCities: "Top cities",
    topRegions: "Top regions",
    topDays: "Top days",
    popularHours: "Most popular hours",
    topSocial: "Top social media platforms",
    topSources: "Top sources",
    topBrowsers: "Top browsers",
    topDevices: "Top devices",
    topLanguages: "Top languages",
    topPlatforms: "Top platforms"
  }
} as const;

function formatNumber(value: number, lang: AdminLang): string {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US").format(value);
}

function formatLastClick(value: string | null, lang: AdminLang): string {
  if (!value) return rebrandlyWords[lang].noLastClick;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(lang === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function ListCard({
  title,
  data,
  lang
}: {
  title: string;
  data: LabelCount[];
  lang: AdminLang;
}) {
  const max = data[0]?.clicks ?? 0;

  return (
    <article className="rb-panel rb-analytics-card">
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p className="rb-muted">{rebrandlyWords[lang].noData}</p>
      ) : (
        <ul className="rb-stat-list">
          {data.slice(0, 8).map((item) => {
            const ratio = max > 0 ? Math.max(4, Math.round((item.clicks / max) * 100)) : 4;
            return (
              <li key={item.label}>
                <span>{item.label}</span>
                <div className="rb-stat-bar">
                  <i style={{ width: `${ratio}%` }} />
                </div>
                <strong>{formatNumber(item.clicks, lang)}</strong>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

function RebrandlyCharts(props: RebrandlyChartsProps) {
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("days");
  const copy = rebrandlyWords[props.lang];
  const activeSeries =
    granularity === "hours" ? props.timeseries.hours : granularity === "months" ? props.timeseries.months : props.timeseries.days;

  const performanceData = useMemo(
    () => ({
      labels: activeSeries.map((point) => point.label),
      datasets: [
        {
          label: copy.clicks,
          data: activeSeries.map((point) => point.clicks),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.2)",
          fill: true,
          tension: 0.28,
          pointRadius: 2
        }
      ]
    }),
    [activeSeries, copy.clicks]
  );

  const clickTypeData = useMemo(
    () => ({
      labels: props.clickType.map((entry) => entry.label),
      datasets: [
        {
          data: props.clickType.map((entry) => entry.clicks),
          backgroundColor: ["#f87171", "#374151", "#fb923c", "#60a5fa"],
          borderWidth: 0
        }
      ]
    }),
    [props.clickType]
  );

  const countryBars = useMemo(
    () => ({
      labels: props.worldMap.slice(0, 8).map((entry) => entry.label),
      datasets: [
        {
          label: copy.clicks,
          data: props.worldMap.slice(0, 8).map((entry) => entry.clicks),
          backgroundColor: "#f97316"
        }
      ]
    }),
    [copy.clicks, props.worldMap]
  );

  const worldTotal = useMemo(() => props.worldMap.reduce((sum, entry) => sum + entry.clicks, 0), [props.worldMap]);

  return (
    <section className="rb-report-grid">
      <article className="rb-panel rb-overview-card">
        <header className="rb-overview-header">
          <div>
            <h2>{copy.overallPerformance}</h2>
            <p className="rb-muted">{copy.trackClicks}</p>
          </div>
          <div className="rb-time-toggle">
            <button
              type="button"
              className={granularity === "hours" ? "active" : ""}
              onClick={() => setGranularity("hours")}
            >
              {copy.hours}
            </button>
            <button type="button" className={granularity === "days" ? "active" : ""} onClick={() => setGranularity("days")}>
              {copy.days}
            </button>
            <button
              type="button"
              className={granularity === "months" ? "active" : ""}
              onClick={() => setGranularity("months")}
            >
              {copy.months}
            </button>
          </div>
        </header>
        <div className="rb-overview-metrics">
          <article>
            <span>{copy.totalClicks}</span>
            <strong>{formatNumber(props.overview.totalClicks, props.lang)}</strong>
          </article>
          <article>
            <span>{copy.qrScans}</span>
            <strong>{formatNumber(props.overview.qrScans, props.lang)}</strong>
          </article>
          <article>
            <span>{copy.clicksToday}</span>
            <strong>{formatNumber(props.overview.clicksToday, props.lang)}</strong>
          </article>
          <article>
            <span>{copy.lastClick}</span>
            <strong>{formatLastClick(props.overview.lastClickAt, props.lang)}</strong>
          </article>
        </div>
        <div className="rb-chart-box rb-chart-box-lg">
          <Line
            data={performanceData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: {
                  ticks: { color: "#9ca3af" },
                  grid: { color: "rgba(156,163,175,0.15)" }
                },
                y: {
                  ticks: { color: "#9ca3af" },
                  grid: { color: "rgba(156,163,175,0.1)" }
                }
              }
            }}
          />
        </div>
      </article>

      <article className="rb-panel rb-analytics-card">
        <h3>{copy.geoDistribution}</h3>
        <div className="rb-chart-box rb-chart-box-sm">
          <Bar
            data={countryBars}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "#9ca3af" }, grid: { display: false } },
                y: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(156,163,175,0.12)" } }
              }
            }}
          />
        </div>
        <ul className="rb-geo-list">
          {props.worldMap.slice(0, 6).map((entry) => {
            const share = worldTotal > 0 ? Math.round((entry.clicks / worldTotal) * 100) : 0;
            return (
              <li key={entry.label}>
                <span>{entry.label}</span>
                <strong>
                  {formatNumber(entry.clicks, props.lang)} ({share}%)
                </strong>
              </li>
            );
          })}
        </ul>
      </article>

      <ListCard title={copy.topCities} data={props.topCities} lang={props.lang} />
      <ListCard title={copy.topRegions} data={props.topRegions} lang={props.lang} />
      <ListCard title={copy.topDays} data={props.topDays} lang={props.lang} />
      <ListCard title={copy.popularHours} data={props.popularHours} lang={props.lang} />

      <article className="rb-panel rb-analytics-card">
        <h3>{copy.clickType}</h3>
        <div className="rb-click-type-chart">
          <div className="rb-chart-box rb-chart-box-sm">
            <Doughnut
              data={clickTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: "#d1d5db"
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </article>

      <ListCard title={copy.topSocial} data={props.topSocialPlatforms} lang={props.lang} />
      <ListCard title={copy.topSources} data={props.topSources} lang={props.lang} />
      <ListCard title={copy.topBrowsers} data={props.topBrowsers} lang={props.lang} />
      <ListCard title={copy.topDevices} data={props.topDevices} lang={props.lang} />
      <ListCard title={copy.topLanguages} data={props.topLanguages} lang={props.lang} />
      <ListCard title={copy.topPlatforms} data={props.topPlatforms} lang={props.lang} />
    </section>
  );
}

function LegacyCharts(props: LegacyChartsProps) {
  const [range, setRange] = useState<7 | 30>(30);
  const daily = range === 7 ? props.daily7 : props.daily30;

  const dailyData = useMemo(
    () => ({
      labels: daily.map((point) => point.day.slice(5)),
      datasets: [
        {
          label: `Clicks (${range}d)`,
          data: daily.map((point) => point.clicks),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.2)",
          fill: true,
          tension: 0.3
        }
      ]
    }),
    [daily, range]
  );

  const hourlyData = useMemo(
    () => ({
      labels: props.hourly.map((point) => point.hour),
      datasets: [
        {
          label: "Clicks by hour",
          data: props.hourly.map((point) => point.clicks),
          backgroundColor: "#f97316"
        }
      ]
    }),
    [props.hourly]
  );

  const deviceData = useMemo(
    () => ({
      labels: props.topDevices.map((item) => item.label),
      datasets: [
        {
          data: props.topDevices.map((item) => item.clicks),
          backgroundColor: ["#ef4444", "#f59e0b", "#2563eb", "#1f2937", "#6b7280"]
        }
      ]
    }),
    [props.topDevices]
  );

  return (
    <section className="charts-grid">
      <article className="card">
        <div className="chart-header">
          <h3>Daily clicks</h3>
          <div className="toggle-group">
            <button type="button" className={range === 7 ? "toggle active" : "toggle"} onClick={() => setRange(7)}>
              7d
            </button>
            <button type="button" className={range === 30 ? "toggle active" : "toggle"} onClick={() => setRange(30)}>
              30d
            </button>
          </div>
        </div>
        <Line data={dailyData} />
      </article>

      <article className="card">
        <h3>Hourly clicks (last 30d)</h3>
        <Bar data={hourlyData} />
      </article>

      <article className="card">
        <h3>Top devices</h3>
        <Doughnut data={deviceData} />
      </article>

      <article className="card">
        <h3>Top countries</h3>
        <ul className="rb-stat-list">
          {props.topCountries.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{item.clicks}</strong>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export default function AdminCharts(props: AdminChartsProps) {
  if (props.mode === "rebrandly") {
    return <RebrandlyCharts {...props} />;
  }
  return <LegacyCharts {...props} />;
}
