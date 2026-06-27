import { useState } from "react";
import { motion } from "framer-motion";

import Navbar from "./components/Navbar";
import ClimateChart from "./components/ClimateChart";
import KPICards from "./components/KPICards";

import { climateDatasets } from "./data/climateDataReal";

type TabKey = "co2" | "temperature" | "seaLevel";

export default function App() {
  const [tab, setTab] = useState<TabKey>("co2");

  const current = climateDatasets[tab];
  
if (!current) {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Error: Dataset not found</h2>
    </div>
  );
}
if (!current?.data) {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Loading climate data...</h2>
    </div>
  );
}

  return (
    <div>
      <Navbar />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          padding: "20px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1>🌍 Climate Analytics Dashboard</h1>

        <p style={{ color: "#555" }}>
          Explore global climate trends using real-world data
        </p>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          <button style={buttonStyle} onClick={() => setTab("co2")}>
            CO₂
          </button>
          <button
            style={buttonStyle}
            onClick={() => setTab("temperature")}
          >
            Temperature
          </button>
          <button
            style={buttonStyle}
            onClick={() => setTab("seaLevel")}
          >
            Sea Level
          </button>
        </div>

        {/* Title */}
        <h2 style={{ marginTop: "25px" }}>
          {current.title} ({current.unit})
        </h2>

        {/* KPI Cards */}
        <KPICards data={current.data} />

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ClimateChart data={current.data} />
        </motion.div>
      </motion.div>
    </div>
  );
}

const buttonStyle = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  backgroundColor: "#fff",
  cursor: "pointer",
};
