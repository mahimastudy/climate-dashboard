import { co2Data } from "../data/sampleClimateData";

export default function CO2Chart() {
  return (
    <div style={{ marginTop: "30px" }}>
      <h2>CO₂ Trends</h2>

      <ul>
        {co2Data.map((item) => (
          <li key={item.year}>
            {item.year}: {item.value} ppm
          </li>
        ))}
      </ul>
    </div>
  );
}