import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Box, TextField, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BedRoundedIcon from "@mui/icons-material/BedRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

const actions = [
  { label: "Open dashboard", keywords: "home overview", path: "", icon: <DashboardRoundedIcon /> },
  { label: "Find patients", keywords: "search people", path: "#patients", icon: <PeopleRoundedIcon /> },
  { label: "Appointments", keywords: "calendar schedule", path: "#appointments", icon: <CalendarMonthRoundedIcon /> },
  { label: "Billing", keywords: "invoice payment", path: "#billing", icon: <ReceiptLongRoundedIcon /> },
  { label: "Ward and beds", keywords: "bed resources", path: "#beds", icon: <BedRoundedIcon /> },
  { label: "Settings", keywords: "account profile", path: "#settings", icon: <SettingsRoundedIcon /> },
];

export default function CommandPalette({ open, onClose, role }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const base = `/dashboard/${role}`;
  const results = useMemo(() => {
    const needle = query.trim().toLower();
    if (!needle) return actions;
    return actions.filter((action) => `${action.label} ${action.keywords}`.toLowerCase().includes(needle));
  }, [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const choose = (action) => {
    if (action.path.startsWith("#")) {
      window.dispatchEvent(new CustomEvent("hf-command", { detail: action.path.slice(1) }));
    } else {
      navigate(base);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { mt: { xs: 8, sm: 12 }, alignSelf: "flex-start", borderRadius: "14px" } }}>
      <Box sx={{ p: 1.5, borderBottom: "1px solid var(--hf-border)" }}>
        <TextField
          autoFocus
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Jump to..."
          InputProps={{ startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
        />
      </Box>
      <List dense sx={{ p: 1 }}>
        {results.length ? results.map((action) => (
          <ListItemButton key={action.label} onClick={() => choose(action)} sx={{ borderRadius: 2, minHeight: 48 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>{action.icon}</ListItemIcon>
            <ListItemText primary={action.label} secondary={action.keywords} />
          </ListItemButton>
        )) : (
          <Typography sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>No matching destinations</Typography>
        )}
      </List>
    </Dialog>
  );
}
