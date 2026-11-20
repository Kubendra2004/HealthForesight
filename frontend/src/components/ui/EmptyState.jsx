import { Box, Typography, Button } from "@mui/material";

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <Box role="status" sx={{ py: 5, px: 2, textAlign: "center", color: "text.secondary" }}>
      {icon && <Box sx={{ color: "primary.main", mb: 1.5 }}>{icon}</Box>}
      <Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 800, mb: 0.5 }}>{title}</Typography>
      {description && <Typography variant="body2" sx={{ maxWidth: 420, mx: "auto", mb: actionLabel ? 2 : 0 }}>{description}</Typography>}
      {actionLabel && <Button variant="contained" onClick={onAction}>{actionLabel}</Button>}
    </Box>
  );
}
