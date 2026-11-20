import { Box, Typography } from "@mui/material";
import FlatCard from "./FlatCard";
import StatusBadge from "./StatusBadge";

export default function ActivityFeed({ items = [] }) {
  return (
    <FlatCard>
      <Typography variant="h6" sx={{ mb: 1.5 }}>Live activity</Typography>
      {items.length ? items.map((item, index) => (
        <Box key={`${item.title}-${index}`} sx={{ display: "grid", gridTemplateColumns: "8px 1fr auto", gap: 1.25, alignItems: "start", py: 1.25, borderTop: index ? "1px solid var(--hf-border)" : 0 }}>
          <Box sx={{ width: 8, height: 8, mt: 0.75, borderRadius: "50%", bgcolor: item.tone === "warning" ? "var(--hf-warning)" : item.tone === "critical" ? "var(--hf-danger)" : "var(--hf-teal-600)" }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.title}</Typography>
            {item.detail && <Typography variant="caption" color="text.secondary">{item.detail}</Typography>}
          </Box>
          {item.status && <StatusBadge label={item.status} tone={item.tone || "neutral"} />}
        </Box>
      )) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No live events yet. Updates will appear here.</Typography>
      )}
    </FlatCard>
  );
}
