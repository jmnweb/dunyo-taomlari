// src/components/ShapeCaptcha.jsx
// Ro'yxatdan o'tishni tasdiqlash uchun sodda "captcha": foydalanuvchi
// bir nechta geometrik figuralar orasidan ko'rsatilgan figurani topib bosishi kerak.
// Bu bot/avtomatik ro'yxatdan o'tishlarning oldini olishga yordam beradigan
// oddiy frontend darajasidagi tekshiruv.

import { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { FaSync, FaTimes } from "react-icons/fa";

const SHAPE_TYPES = ["circle", "square", "triangle", "star", "pentagon", "hexagon"];

const COLORS = ["#e3a23c", "#c1442e", "#4c7a5c", "#3f6fae", "#8b5fbf", "#d17aa8"];

// 3 ustunli, 2 qatorli katakchalarga joylashtiramiz, har birining ichida
// tasodifiy siljish (jitter) beramiz, shunda shakllar bir-biriga ustma-ust tushmaydi.
const GRID_CELLS = [
  { cx: 70, cy: 70 },
  { cx: 200, cy: 70 },
  { cx: 330, cy: 70 },
  { cx: 70, cy: 190 },
  { cx: 200, cy: 190 },
  { cx: 330, cy: 190 },
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateShapes() {
  const shuffledTypes = shuffle(SHAPE_TYPES);
  const target = shuffledTypes[0];
  const shuffledCells = shuffle(GRID_CELLS);
  const shuffledColors = shuffle(COLORS);

  const shapes = shuffledTypes.map((type, index) => {
    const cell = shuffledCells[index];
    return {
      id: `${type}-${index}`,
      type,
      color: shuffledColors[index % shuffledColors.length],
      cx: cell.cx + randomBetween(-14, 14),
      cy: cell.cy + randomBetween(-10, 10),
      rotation: randomBetween(0, 360),
      size: randomBetween(34, 44),
    };
  });

  return { shapes: shuffle(shapes), target };
}

function ShapeSvg({ shape, onClick }) {
  const { type, color, cx, cy, rotation, size } = shape;
  const r = size / 2;

  let inner;
  if (type === "circle") {
    inner = <circle cx={0} cy={0} r={r} fill={color} />;
  } else if (type === "square") {
    inner = <rect x={-r} y={-r} width={size} height={size} fill={color} />;
  } else if (type === "triangle") {
    const points = [
      [0, -r],
      [r * 0.9, r * 0.75],
      [-r * 0.9, r * 0.75],
    ]
      .map((p) => p.join(","))
      .join(" ");
    inner = <polygon points={points} fill={color} />;
  } else if (type === "star") {
    const spikes = 5;
    const outerR = r;
    const innerR = r * 0.45;
    let points = "";
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      points += `${radius * Math.cos(angle)},${radius * Math.sin(angle)} `;
    }
    inner = <polygon points={points.trim()} fill={color} />;
  } else if (type === "pentagon") {
    let points = "";
    for (let i = 0; i < 5; i++) {
      const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
      points += `${r * Math.cos(angle)},${r * Math.sin(angle)} `;
    }
    inner = <polygon points={points.trim()} fill={color} />;
  } else if (type === "hexagon") {
    let points = "";
    for (let i = 0; i < 6; i++) {
      const angle = (2 * Math.PI * i) / 6;
      points += `${r * Math.cos(angle)},${r * Math.sin(angle)} `;
    }
    inner = <polygon points={points.trim()} fill={color} />;
  }

  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`}>
      <g
        className="captcha-shape"
        onClick={() => onClick(shape.type)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick(shape.type);
        }}
      >
        {inner}
      </g>
    </g>
  );
}

const SHAPE_NAME_KEYS = {
  circle: "captcha.shapeCircle",
  square: "captcha.shapeSquare",
  triangle: "captcha.shapeTriangle",
  star: "captcha.shapeStar",
  pentagon: "captcha.shapePentagon",
  hexagon: "captcha.shapeHexagon",
};

function ShapeCaptcha({ onSuccess, onCancel }) {
  const { t } = useLanguage();
  const [{ shapes, target }, setChallenge] = useState(generateShapes);
  const [status, setStatus] = useState("idle"); // idle | wrong | correct

  function regenerate() {
    setChallenge(generateShapes());
    setStatus("idle");
  }

  function handleShapeClick(type) {
    if (status === "correct") return;

    if (type === target) {
      setStatus("correct");
      setTimeout(() => onSuccess(), 450);
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus("idle"), 500);
    }
  }

  return (
    <div className="captcha-overlay" role="dialog" aria-modal="true">
      <div className="captcha-card">
        <h3 className="captcha-title">{t("captcha.title")}</h3>
        <p className="captcha-instruction">
          {t("captcha.instructionPrefix")} <strong>{t(SHAPE_NAME_KEYS[target])}</strong>{" "}
          {t("captcha.instructionSuffix")}
        </p>

        <svg
          viewBox="0 0 400 260"
          className={`captcha-board ${status === "wrong" ? "captcha-board-shake" : ""}`}
        >
          {shapes.map((shape) => (
            <ShapeSvg key={shape.id} shape={shape} onClick={handleShapeClick} />
          ))}
        </svg>

        {status === "wrong" && <p className="captcha-feedback captcha-feedback-wrong">{t("captcha.wrong")}</p>}
        {status === "correct" && (
          <p className="captcha-feedback captcha-feedback-correct">{t("captcha.correct")}</p>
        )}

        <div className="captcha-actions">
          <button type="button" className="captcha-btn captcha-btn-ghost" onClick={regenerate}>
            <FaSync /> {t("captcha.refresh")}
          </button>
          <button type="button" className="captcha-btn captcha-btn-ghost" onClick={onCancel}>
            <FaTimes /> {t("captcha.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShapeCaptcha;
