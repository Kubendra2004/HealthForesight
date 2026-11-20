import { Box, Typography } from "@mui/material";
import FlatCard from "./FlatCard";

export default function ForecastHorizon({ data = [], title = "7-day forecast", threshold = null }) {
  const max = Math.max(1, ...data.map((point) => Number(point.value || 0)));
  return (
    <FlatCard>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {threshold != null && <Typography variant="caption" color="text.secondary">Warning under {threshold}</Typography>}
      </Box>
      {data.length ? (
        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${data.length}, minmax(38px, 1fr))`, alignItems: "end", gap: 1, minHeight: 170 }}>
          {data.map((point) => {
            const value = Number(point.value || 0);
            const warning = threshold != null && value < threshold;
            return (
              <Box key={point.label} sx={{ minWidth: 0, textAlign: "center" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
                <Box sx={{ height: 112, display: "flex", alignItems: "end", justifyContent: "center", mt: 0.5, borderBottom: "1px solid var(--hf-border)" }}>
                  <Box sx={{ width: "68%", height: `${Math.max(8, (value / max) * 100)}%`, borderRadius: "8px 8px 0 0", bgcolor: warning ? "var(--hf-warning)" : "var(--hf-teal-600)", transition: "height 220ms var(--hf-ease)" }} />
                </Box>
                <Typography variant="caption" noWrap sx={{ mt: 0.5, display: "block", color: "text.secondary" }}>{point.label}</Typography>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 5 }}>No forecast is available. Generate a resource forecast to populate this horizon.</Typography>
      )}
    </FlatCard>
  );
}
