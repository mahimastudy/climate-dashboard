export default function Navbar() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "15px 20px",
        backgroundColor: "#111",
        color: "white",
        alignItems: "center",
      }}
    >
      <div style={{ fontWeight: "bold" }}>
        Climate Dashboard
      </div>

      <div style={{ display: "flex", gap: "16px" }}>
        <span>Home</span>
        <span>Data</span>
        <span>Trends</span>
      </div>
    </div>
  );
}