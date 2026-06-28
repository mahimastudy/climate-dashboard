import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import "./App.css";
import ClimateChart from "./components/ClimateChart";
import { climateDatasets } from "./data/climateDataReal";

type DatasetKey = keyof typeof climateDatasets;

const datasetOptions: Array<{ key: DatasetKey; label: string }> = [
  { key: "co2", label: "CO2" },
  { key: "temperature", label: "Temperature" },
  { key: "seaLevel", label: "Sea Level" },
];

function latestValue(key: DatasetKey) {
  const dataset = climateDatasets[key];
  return dataset.data[dataset.data.length - 1].value;
}

function averageValue(key: DatasetKey) {
  const values = climateDatasets[key].data.map((point) => point.value);
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: value < 10 ? 2 : 0,
  })} ${unit}`;
}

export default function App() {
  const [datasetKey, setDatasetKey] = useState<DatasetKey>("co2");
  const current = climateDatasets[datasetKey];

  const kpis = useMemo(
    () => [
      {
        label: "Avg Temp",
        value: formatValue(averageValue("temperature"), "C"),
        detail: "Mean anomaly across available years",
      },
      {
        label: "Sea Level Rise",
        value: formatValue(latestValue("seaLevel"), "mm"),
        detail: "Latest recorded level in this sample",
      },
      {
        label: "CO2 ppm",
        value: formatValue(latestValue("co2"), "ppm"),
        detail: "Latest atmospheric concentration",
      },
      {
        label: "Data Coverage",
        value: `${current.data[0].year}-${current.data[current.data.length - 1].year}`,
        detail: `${current.data.length} observations for ${current.title}`,
      },
    ],
    [current]
  );

  const insights = [
    "CO2 concentration climbs steadily through every decade in the sample.",
    "Sea level rise accelerates after 2000, reaching the highest level in 2025.",
    "Temperature anomaly remains above 1 C in the latest readings.",
  ];

  return (
    <main className="dashboard-shell">
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
              className="kpi-card"
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <p>{kpi.detail}</p>
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
          <ClimateChart data={current.data} />
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
