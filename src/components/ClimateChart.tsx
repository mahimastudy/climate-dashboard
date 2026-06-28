import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ClimatePoint = {
  timestamp: number;
  value: number;
};

type ClimateChartProps = {
  data: ClimatePoint[];
  unit: string;
};

function formatTick(timestamp: number, span: number) {
  if (span <= 2 * 24 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
    }).format(timestamp);
  }

  if (span <= 365 * 24 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(timestamp);
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
  }).format(timestamp);
}

function formatTooltipDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function LatestDot(props: {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: ClimatePoint;
  dataLength?: number;
}) {
  const { cx, cy, index, dataLength } = props;

  if (cx == null || cy == null || index !== (dataLength ?? 0) - 1) {
    return null;
  }

  return (
    <g className="latest-data-point">
      <circle cx={cx} cy={cy} r={8}>
        <animate attributeName="r" dur="1s" repeatCount="indefinite" values="8;16;8" />
        <animate attributeName="opacity" dur="1s" repeatCount="indefinite" values="0.85;0.1;0.85" />
      </circle>
      <circle cx={cx} cy={cy} r={5} />
    </g>
  );
}

export default function ClimateChart({ data, unit }: ClimateChartProps) {
  const firstTimestamp = data[0]?.timestamp ?? Date.now();
  const lastTimestamp = data[data.length - 1]?.timestamp ?? Date.now();
  const span = lastTimestamp - firstTimestamp;

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 18, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#d8e5de" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            domain={["dataMin", "dataMax"]}
            minTickGap={28}
            tickFormatter={(timestamp) => formatTick(Number(timestamp), span)}
            tickLine={false}
            type="number"
          />
          <YAxis
            domain={["auto", "auto"]}
            tickLine={false}
            tickFormatter={(value) => `${value}`}
            width={46}
          />
          <Tooltip
            labelFormatter={(timestamp) => formatTooltipDate(Number(timestamp))}
            formatter={(value) => [`${Number(value).toFixed(2)} ${unit}`, "Value"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1f7a5a"
            strokeWidth={3}
            dot={(props) => <LatestDot {...props} dataLength={data.length} />}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
