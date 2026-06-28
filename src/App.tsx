import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import "./App.css";
import earthImage from "./assets/earth-blue-marble.jpg";
import ClimateChart, { type ClimatePoint } from "./components/ClimateChart";
import { climateDatasets } from "./data/climateDataReal";
import {
  fetchTopClimateHeadline,
  fetchHighestPollutionArea,
  fetchHighestTemperatureToday,
  fetchLiveClimateSeries,
  type ClimateHeadline,
  type HighestPollutionArea,
  type HighestTemperatureToday,
} from "./services/climateService";

type DatasetKey = keyof typeof climateDatasets;
type RangeKey = "full" | "20y" | "10y" | "1y" | "6m" | "1m" | "24h";

const datasetOptions: Array<{ key: DatasetKey; label: string }> = [
  { key: "co2", label: "CO2" },
  { key: "temperature", label: "Temperature" },
  { key: "seaLevel", label: "Sea Level" },
];

const rangeOptions: Array<{ key: RangeKey; label: string; durationMs?: number }> = [
  { key: "full", label: "Full" },
  { key: "20y", label: "20 years", durationMs: 20 * 365 * 24 * 60 * 60 * 1000 },
  { key: "10y", label: "10 years", durationMs: 10 * 365 * 24 * 60 * 60 * 1000 },
  { key: "1y", label: "1 year", durationMs: 365 * 24 * 60 * 60 * 1000 },
  { key: "6m", label: "6 months", durationMs: 182 * 24 * 60 * 60 * 1000 },
  { key: "1m", label: "1 month", durationMs: 30 * 24 * 60 * 60 * 1000 },
  { key: "24h", label: "24 hrs", durationMs: 24 * 60 * 60 * 1000 },
];

const dayMs = 24 * 60 * 60 * 1000;
const hourMs = 60 * 60 * 1000;
const pollingMs = 30 * 1000;
const temperaturePollingMs = 10 * 60 * 1000;
const pollutionPollingMs = 10 * 60 * 1000;
const headlinePollingMs = 15 * 60 * 1000;
const countryMapMarkers: Record<string, { x: number; y: number }> = {
  AU: { x: 172, y: 78 },
  ET: { x: 111, y: 59 },
  IQ: { x: 117, y: 45 },
  KW: { x: 120, y: 47 },
  ML: { x: 91, y: 54 },
  PK: { x: 134, y: 48 },
  QA: { x: 123, y: 49 },
  SA: { x: 118, y: 51 },
  US: { x: 38, y: 42 },
};

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: value < 10 ? 2 : 0,
  })} ${unit}`;
}

function celsiusToFahrenheit(value: number) {
  return value * 1.8 + 32;
}

function formatTemperatureReading(reading: HighestTemperatureToday | null) {
  if (!reading) {
    return "Loading";
  }

  return `${formatValue(celsiusToFahrenheit(reading.value), "°F")} in ${reading.location}`;
}

function formatPollutionReading(reading: HighestPollutionArea | null) {
  if (!reading) {
    return "Loading";
  }

  return reading.location;
}

function formatHeadlineReading(headline: ClimateHeadline | null) {
  return headline?.title ?? "Loading";
}

function valueAtYear(key: DatasetKey, year: number) {
  const points = climateDatasets[key].data;
  const first = points[0];
  const last = points[points.length - 1];

  if (year <= first.year) {
    return first.value;
  }

  if (year >= last.year) {
    const previous = points[points.length - 2];
    const yearlyTrend = (last.value - previous.value) / (last.year - previous.year);
    return last.value + yearlyTrend * (year - last.year);
  }

  const nextIndex = points.findIndex((point) => point.year >= year);
  const next = points[nextIndex];
  const previous = points[nextIndex - 1];
  const progress = (year - previous.year) / (next.year - previous.year);

  return previous.value + (next.value - previous.value) * progress;
}

function generateLiveSeed(key: DatasetKey): ClimatePoint[] {
  const now = Date.now();
  const startYear = climateDatasets[key].data[0].year;
  const start = new Date(startYear, 0, 1).getTime();
  const points: ClimatePoint[] = [];

  for (let timestamp = start; timestamp < now - 30 * dayMs; timestamp += 30 * dayMs) {
    const year = new Date(timestamp).getFullYear();
    const seasonalMovement = Math.sin(timestamp / (365 * dayMs)) * 0.18;
    points.push({
      timestamp,
      value: Number((valueAtYear(key, year) + seasonalMovement).toFixed(2)),
    });
  }

  for (let timestamp = now - 30 * dayMs; timestamp <= now; timestamp += hourMs) {
    const year = new Date(timestamp).getFullYear();
    const liveMovement = Math.sin(timestamp / (6 * hourMs)) * 0.08;
    points.push({
      timestamp,
      value: Number((valueAtYear(key, year) + liveMovement).toFixed(2)),
    });
  }

  return points;
}

function filterByRange(data: ClimatePoint[], rangeKey: RangeKey) {
  const option = rangeOptions.find((range) => range.key === rangeKey);

  if (!option?.durationMs) {
    return data;
  }

  const cutoff = Date.now() - option.durationMs;
  const filtered = data.filter((point) => point.timestamp >= cutoff);
  return filtered.length > 0 ? filtered : data.slice(-1);
}

function WorldMapHighlight({ countryCode }: { countryCode: string }) {
  const marker = countryMapMarkers[countryCode] ?? countryMapMarkers.US;

  return (
    <svg
      aria-hidden="true"
      className="world-map"
      viewBox="0 0 200 100"
    >
      <path d="M13 35 27 24 47 26 60 35 54 48 36 52 26 64 13 54Z" />
      <path d="M53 59 65 65 62 83 49 92 42 77Z" />
      <path d="M79 31 96 23 111 29 110 44 97 48 83 43Z" />
      <path d="M98 50 116 46 130 56 122 75 108 78 95 65Z" />
      <path d="M113 28 139 22 166 32 174 48 151 55 132 45Z" />
      <path d="M162 68 181 72 190 83 175 91 156 84Z" />
      <circle className="map-highlight-ring" cx={marker.x} cy={marker.y} r="9" />
      <circle className="map-highlight-dot" cx={marker.x} cy={marker.y} r="4" />
    </svg>
  );
}

function AqiGauge({ value }: { value: number }) {
  const position = Math.min(Math.max(value / 300, 0), 1) * 100;

  return (
    <div className="aqi-gauge" aria-label={`Current AQI ${Math.round(value)}`}>
      <div className="aqi-gauge-bar">
        <span className="aqi-gauge-value" style={{ left: `${position}%` }}>
          {Math.round(value)}
        </span>
        <span className="aqi-gauge-dot" style={{ left: `${position}%` }} />
      </div>
      <div className="aqi-gauge-labels">
        <span>0</span>
        <span>300+</span>
      </div>
    </div>
  );
}

export default function App() {
  const [datasetKey, setDatasetKey] = useState<DatasetKey>("co2");
  const [rangeKey, setRangeKey] = useState<RangeKey>("full");
  const [liveData, setLiveData] = useState<ClimatePoint[]>(() => generateLiveSeed("co2"));
  const [sourceStatus, setSourceStatus] = useState("Connecting to climate API...");
  const [highestTempToday, setHighestTempToday] =
    useState<HighestTemperatureToday | null>(null);
  const [temperatureStatus, setTemperatureStatus] = useState("Loading UTC max");
  const [highestPollution, setHighestPollution] =
    useState<HighestPollutionArea | null>(null);
  const [pollutionStatus, setPollutionStatus] = useState("Loading air quality");
  const [climateHeadline, setClimateHeadline] =
    useState<ClimateHeadline | null>(null);
  const [headlineStatus, setHeadlineStatus] = useState("Searching headlines");
  const current = climateDatasets[datasetKey];
  const visibleData = useMemo(
    () => filterByRange(liveData, rangeKey),
    [liveData, rangeKey]
  );
  const newestPoint = visibleData[visibleData.length - 1] ?? liveData[liveData.length - 1];

  useEffect(() => {
    setLiveData(generateLiveSeed(datasetKey));
    setSourceStatus("Connecting to climate API...");

    let cancelled = false;

    async function refreshSeries() {
      try {
        const apiData = await fetchLiveClimateSeries(datasetKey);

        if (cancelled) {
          return;
        }

        if (apiData.length > 0) {
          setLiveData(apiData);
          setSourceStatus(`Live API polling every ${pollingMs / 1000}s`);
          return;
        }

        setSourceStatus("No live API series for this dataset; using local sample data");
      } catch {
        if (!cancelled) {
          setSourceStatus("API unavailable; using local sample data");
        }
      }
    }

    refreshSeries();
    const interval = window.setInterval(refreshSeries, pollingMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [datasetKey]);

  useEffect(() => {
    let cancelled = false;

    async function refreshHighestTemperature() {
      try {
        const reading = await fetchHighestTemperatureToday();

        if (!cancelled) {
          setHighestTempToday(reading);
          setTemperatureStatus("Open-Meteo UTC daily max");
        }
      } catch {
        if (!cancelled) {
          setTemperatureStatus("Live temperature API unavailable");
        }
      }
    }

    refreshHighestTemperature();
    const interval = window.setInterval(
      refreshHighestTemperature,
      temperaturePollingMs
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshHighestPollution() {
      try {
        const reading = await fetchHighestPollutionArea();

        if (!cancelled) {
          setHighestPollution(reading);
          setPollutionStatus(
            reading.pm25 === null
              ? "Open-Meteo live U.S. AQI"
              : `Open-Meteo live U.S. AQI, PM2.5 ${reading.pm25.toFixed(1)}`
          );
        }
      } catch {
        if (!cancelled) {
          setPollutionStatus("Live air quality API unavailable");
        }
      }
    }

    refreshHighestPollution();
    const interval = window.setInterval(
      refreshHighestPollution,
      pollutionPollingMs
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshClimateHeadline() {
      try {
        const headline = await fetchTopClimateHeadline();

        if (!cancelled) {
          setClimateHeadline(headline);
          setHeadlineStatus(`News search from ${headline.source}`);
        }
      } catch {
        if (!cancelled) {
          setHeadlineStatus("News search temporarily unavailable");
        }
      }
    }

    refreshClimateHeadline();
    const interval = window.setInterval(
      refreshClimateHeadline,
      headlinePollingMs
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const kpis = useMemo(
    () => [
      {
        countryCode: highestTempToday?.countryCode,
        label: "Highest Recorded Temperature Today",
        value: formatTemperatureReading(highestTempToday),
        detail: temperatureStatus,
      },
      {
        label: "Area With Highest Pollution",
        pollutionAqi: highestPollution?.usAqi,
        value: formatPollutionReading(highestPollution),
        detail: pollutionStatus,
      },
      {
        headlineUrl: climateHeadline?.url,
        label: "Top Climate Headline",
        value: formatHeadlineReading(climateHeadline),
        detail: headlineStatus,
      },
      {
        label: "Data Coverage",
        value: `${visibleData.length} pts`,
        detail: `${rangeOptions.find((range) => range.key === rangeKey)?.label} view for ${current.title}`,
      },
    ],
    [
      current,
      climateHeadline,
      headlineStatus,
      highestPollution,
      highestTempToday,
      pollutionStatus,
      rangeKey,
      temperatureStatus,
      visibleData.length,
    ]
  );

  const insights = [
    "CO2 concentration climbs steadily through every decade in the sample.",
    "Sea level rise accelerates after 2000, reaching the highest level in 2025.",
    "Live chart values refresh every two seconds, with the newest datapoint pulsing red.",
  ];

  return (
    <main
      className="dashboard-shell"
      style={
        {
          "--earth-image": `url(${earthImage})`,
        } as CSSProperties
      }
    >
      <div className="space-backdrop" aria-hidden="true">
        <div className="earth-backdrop" />
      </div>

      <motion.section
        className="dashboard"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">ClimateScope</p>
            <h1>ClimateScope</h1>
          </div>

          <label className="dataset-select">
            <span>Current Dataset</span>
            <select
              value={datasetKey}
              onChange={(event) => setDatasetKey(event.target.value as DatasetKey)}
            >
              {datasetOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        <section className="kpi-grid" aria-label="Climate metrics">
          {kpis.map((kpi, index) => (
            <motion.article
              className={`kpi-card ${kpi.countryCode ? "temperature-card" : ""} ${kpi.headlineUrl ? "headline-card" : ""}`}
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <span>{kpi.label}</span>
              {kpi.pollutionAqi !== undefined ? (
                <AqiGauge value={kpi.pollutionAqi} />
              ) : null}
              {kpi.headlineUrl ? (
                <a href={kpi.headlineUrl} rel="noreferrer" target="_blank">
                  {kpi.value}
                </a>
              ) : (
                <strong>{kpi.value}</strong>
              )}
              <p>{kpi.detail}</p>
              {kpi.countryCode ? (
                <WorldMapHighlight countryCode={kpi.countryCode} />
              ) : null}
            </motion.article>
          ))}
        </section>

        <section className="chart-section">
          <div className="section-heading">
            <div>
              <h2>Interactive Line Chart</h2>
              <p>
                {current.title} measured in {current.unit}
              </p>
            </div>
            <span>{current.unit}</span>
          </div>

          <div className="chart-toolbar" aria-label="Chart time range">
            {rangeOptions.map((range) => (
              <button
                className={range.key === rangeKey ? "active" : ""}
                key={range.key}
                onClick={() => setRangeKey(range.key)}
                type="button"
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="live-readout">
            <span>Live value</span>
            <strong>{formatValue(newestPoint.value, current.unit)}</strong>
            <em>{sourceStatus}</em>
          </div>

          <ClimateChart data={visibleData} unit={current.unit} />
        </section>

        <section className="insights-section">
          <h2>Recent Climate Insights</h2>
          <div className="insight-list">
            {insights.map((insight) => (
              <article className="insight-card" key={insight}>
                {insight}
              </article>
            ))}
          </div>
        </section>
      </motion.section>
    </main>
  );
}
