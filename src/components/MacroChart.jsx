// src/components/MacroChart.jsx
import { useLanguage } from "../context/LanguageContext.jsx";

// Oqsil/uglevod/yog' nisbatini (kaloriya bo'yicha) doira diagrammada ko'rsatadi.
// Hisob-kitob: oqsil va uglevod — 4 kkal/g, yog' — 9 kkal/g (standart ozuqa fani formulasi).
function MacroChart({ protein, carbs, fat }) {
  const { t } = useLanguage();

  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  const total = proteinCal + carbsCal + fatCal || 1;

  const proteinPct = Math.round((proteinCal / total) * 100);
  const carbsPct = Math.round((carbsCal / total) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  const proteinDeg = (proteinPct / 100) * 360;
  const carbsDeg = (carbsPct / 100) * 360;

  const gradient = `conic-gradient(
    var(--basil) 0deg ${proteinDeg}deg,
    var(--turmeric) ${proteinDeg}deg ${proteinDeg + carbsDeg}deg,
    var(--chili) ${proteinDeg + carbsDeg}deg 360deg
  )`;

  return (
    <div className="macro-chart">
      <div className="macro-chart-donut" style={{ background: gradient }}>
        <div className="macro-chart-hole" />
      </div>
      <div className="macro-chart-legend">
        <div className="macro-legend-item">
          <span className="macro-dot macro-dot-protein" />
          {t("detail.protein")}: <strong>{proteinPct}%</strong>
        </div>
        <div className="macro-legend-item">
          <span className="macro-dot macro-dot-carbs" />
          {t("detail.carbs")}: <strong>{carbsPct}%</strong>
        </div>
        <div className="macro-legend-item">
          <span className="macro-dot macro-dot-fat" />
          {t("detail.fat")}: <strong>{fatPct}%</strong>
        </div>
      </div>
    </div>
  );
}

export default MacroChart;
