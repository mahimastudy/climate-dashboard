import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ClimateChart({ data }: any) {
  return (
    <div style={{ width: "100%", height: 300, marginTop: 20 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#1d4ed8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}