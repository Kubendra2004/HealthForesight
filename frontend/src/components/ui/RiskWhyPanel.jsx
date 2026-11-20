import { Box, LinearProgress, Typography } from "@mui/material";
import FlatCard from "./FlatCard";

export default function RiskWhyPanel({ title = "Risk drivers", risk, factors = [] }) {
  return (
    <FlatCard>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Explainable output</Typography>
          <Typography variant="h6" sx={{ mt: 0.25 }}>{title}</Typography>
        </Box>
        {typeof risk === "number" && (
          <Typography sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", color: risk >= 70 ? "error.main" : "warning.main" }}>
            {Math.round(risk)}%
          </Typography>
        )}
      </Box>
      {factors.length ? factors.map((factor) => (
        <Box key={factor.label} sx={{ mb: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{factor.label}</Typography>
            <Typography variant="caption" color="text.secondary">{factor.direction === "up" ? "Pushes risk up" : "Lowers risk"}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.max(4, Math.min(100, factor.value))}
            sx={{
              height: 6,
              borderRadius: 999,
              bgcolor: "#edf2f0",
              "& .MuiLinearProgress-bar": { bgcolor: factor.direction === "up" ? "var(--hf-danger)" : "var(--hf-success)" },
            }}
          />
        </Box>
      )) : (
        <Typography variant="body2" color="text.secondary">
          Complete the clinical inputs to generate a readable explanation. Missing values are not estimated.
        </Typography>
      )}
    </FlatCard>
  );
}
