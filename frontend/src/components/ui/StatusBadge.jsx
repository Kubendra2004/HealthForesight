import { Chip } from "@mui/material";

const tones = {
  critical: { dot: "var(--hf-danger)", bg: "#fef3f2", color: "#912018" },
  warning: { dot: "var(--hf-warning)", bg: "#fffaeb", color: "#93370d" },
  stable: { dot: "var(--hf-success)", bg: "#ecfdf3", color: "#067647" },
  info: { dot: "var(--hf-info)", bg: "#eff8ff", color: "#1849a9" },
  neutral: { dot: "#667085", bg: "#f2f4f7", color: "#344054" },
};

export default function StatusBadge({ label, tone = "neutral", sx = {} }) {
  const style = tones[tone] || tones.neutral;
  return (
    <Chip
      size="small"
      label={
        <span className="status-badge-label">
          <span className="status-badge-dot" style={{ backgroundColor: style.dot }} />
          {label}
        </span>
      }
      sx={{ bgcolor: style.bg, color: style.color, border: "1px solid transparent", height: 26, fontWeight: 700, ...sx }}
    />
  );
}
