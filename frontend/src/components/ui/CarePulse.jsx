import { useEffect, useState } from "react";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";

export default function CarePulse({ size = 44, pulse = false, label = "Care Pulse" }) {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return (
    <span className={`care-pulse ${pulse && visible ? "is-pulse" : ""}`} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeOpacity=".22" />
        <path d="M6 25h8l4-9 7 17 5-12 3 4h9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <FavoriteRoundedIcon className="care-pulse-core" aria-hidden="true" />
    </span>
  );
}
