// src/components/StarRating.jsx
import { FaStar, FaRegStar } from "react-icons/fa";

function StarRating({ rating = 0, onRate, size = "1rem" }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onRate === "function";

  return (
    <span className="star-rating" style={{ fontSize: size }}>
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= Math.round(rating) ? "star-filled" : ""} ${
            interactive ? "star-interactive" : ""
          }`}
          onClick={interactive ? () => onRate(star) : undefined}
        >
          {star <= Math.round(rating) ? <FaStar /> : <FaRegStar />}
        </span>
      ))}
    </span>
  );
}

export default StarRating;
