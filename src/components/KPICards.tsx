import { motion } from "framer-motion";

export default function KPICards({ data }: any) {
  const latest = data[data.length - 1];
  const first = data[0];
  const change = (latest.value - first.value).toFixed(2);

  const cards = [
    { title: "Latest Value", value: latest.value },
    { title: "Total Change", value: `+${change}` },
    { title: "Data Points", value: data.length },
  ];

  return (
    <div style={{ display: "flex", gap: "16px", marginTop: "20px", flexWrap: "wrap" }}>
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.05 }}
          style={cardStyle}
        >
          <h3>{card.title}</h3>
          <p style={valueStyle}>{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

const cardStyle = {
  flex: "1",
  minWidth: "150px",
  padding: "16px",
  backgroundColor: "#f3f4f6",
  borderRadius: "10px",
  textAlign: "center" as const,
  cursor: "pointer",
};

const valueStyle = {
  fontSize: "22px",
  fontWeight: "bold",
  marginTop: "8px",
};