// src/components/BarChart.jsx
// Kutubxonasiz, sof CSS asosidagi oddiy ustunli diagramma.
// data = [{ label: "Uzbekistan", value: 3 }, ...]

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div className="bar-chart-row" key={item.label}>
          <span className="bar-chart-label">{item.label}</span>
          <div className="bar-chart-track">
            <div
              className="bar-chart-fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="bar-chart-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default BarChart;
