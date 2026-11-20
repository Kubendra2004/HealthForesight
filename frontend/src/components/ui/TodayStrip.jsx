import { Box, Typography } from "@mui/material";

export default function TodayStrip({ items = [] }) {
  if (!items.length) return null;
  return (
    <Box component="section" aria-label="Today attention summary" className="today-strip">
      <Typography component="span" className="today-strip-title">Today</Typography>
      {items.map((item) => (
        <button key={item.label} type="button" className={`today-item ${item.tone || "info"}`} onClick={item.onClick}>
          <span className="today-item-dot" aria-hidden="true" />
          <span><strong>{item.count}</strong> {item.label}</span>
        </button>
      ))}
    </Box>
  );
}
