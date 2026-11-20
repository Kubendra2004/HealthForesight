import { Box, Button, Typography } from "@mui/material";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import MedicationRoundedIcon from "@mui/icons-material/MedicationRounded";
import FlatCard from "./FlatCard";

export default function HealthStory({ appointments = [], prescriptions = [], onBook, onAsk }) {
  const items = [
    ...appointments.slice(0, 5).map((item) => ({
      key: `appointment-${item._id || item.date}`,
      date: item.date,
      title: item.reason || "Appointment",
      detail: `${item.status || "Scheduled"} with ${item.doctor_id || "care team"}`,
      icon: <EventAvailableRoundedIcon />,
    })),
    ...prescriptions.slice(0, 5).map((item) => ({
      key: `prescription-${item._id || item.date}`,
      date: item.date,
      title: item.medicines?.[0]?.name || "Prescription",
      detail: item.instructions || "Medication record",
      icon: <MedicationRoundedIcon />,
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <FlatCard>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Health Story</Typography>
          <Typography variant="h6">Your care timeline</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {onBook && <Button variant="outlined" size="small" onClick={onBook}>Book</Button>}
          {onAsk && <Button variant="contained" size="small" onClick={onAsk}>Ask</Button>}
        </Box>
      </Box>
      {items.length ? (
        <Box sx={{ maxHeight: 280, overflowY: "auto", pr: 1 }}>
          {items.map((item, index) => (
            <Box key={item.key} sx={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 1.25, position: "relative", pb: index === items.length - 1 ? 0 : 2 }}>
              {index !== items.length - 1 && <Box sx={{ position: "absolute", left: 17, top: 36, bottom: 0, width: 1, bgcolor: "var(--hf-border)" }} />}
              <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50%", color: "var(--hf-teal-700)", bgcolor: "var(--hf-workspace-tint)", zIndex: 1 }}>{item.icon}</Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{item.date ? new Date(item.date).toLocaleDateString() : "Date unavailable"}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                <Typography variant="caption" color="text.secondary">{item.detail}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
          <MonitorHeartRoundedIcon sx={{ mb: 1 }} />
          <Typography variant="body2">No health events have been recorded yet.</Typography>
        </Box>
      )}
    </FlatCard>
  );
}
