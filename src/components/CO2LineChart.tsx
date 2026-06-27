import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { co2Data } from "../data/sampleClimateData";

export default function CO2LineChart() {
  return (
    <div style={{ width: "100%", height: 300, marginTop: 30 }}>
      <h2>CO₂ Emissions Over Time</h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={co2Data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="blue" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}