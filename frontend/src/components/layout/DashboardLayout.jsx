import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BedRoundedIcon from "@mui/icons-material/BedRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import CarePulse from "../ui/CarePulse";
import CommandPalette from "./CommandPalette";
import "./DashboardShell.css";

const roleLabels = {
  patient: "Patient portal",
  doctor: "Care team",
  admin: "Administration",
  frontdesk: "Front desk",
};

const navByRole = {
  patient: [
    ["Overview", "dashboard", <DashboardRoundedIcon />],
    ["Appointments", "appointments", <CalendarMonthRoundedIcon />],
    ["Health story", "story", <MonitorHeartRoundedIcon />],
  ],
  doctor: [
    ["Overview", "dashboard", <DashboardRoundedIcon />],
    ["Patients", "patients", <PeopleRoundedIcon />],
    ["Prescriptions", "prescriptions", <ReceiptLongRoundedIcon />],
  ],
  frontdesk: [
    ["Overview", "dashboard", <DashboardRoundedIcon />],
    ["Appointments", "appointments", <CalendarMonthRoundedIcon />],
    ["Ward", "beds", <BedRoundedIcon />],
    ["Billing", "billing", <ReceiptLongRoundedIcon />],
  ],
  admin: [
    ["Overview", "dashboard", <DashboardRoundedIcon />],
    ["Users", "users", <PeopleRoundedIcon />],
    ["Resources", "resources", <BedRoundedIcon />],
    ["Audit", "audit", <SettingsRoundedIcon />],
  ],
};

export default function DashboardLayout({ children, title, role }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const displayName = user?.name || user?.username || "Account";
  const navItems = navByRole[role] || navByRole.patient;

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleNav = (id) => window.dispatchEvent(new CustomEvent("hf-command", { detail: id }));

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Box className={`dashboard-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <CarePulse size={38} pulse={isConnected} />
          {!collapsed && <Typography component="span">Health<span>Foresight</span></Typography>}
          <IconButton className="sidebar-collapse" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <MenuRoundedIcon /> : <ChevronLeftRoundedIcon />}
          </IconButton>
        </div>

        <nav aria-label="Dashboard navigation">
          <List sx={{ px: 1 }}>
            {navItems.map(([label, id, icon]) => (
              <Tooltip key={id} title={collapsed ? label : ""} placement="right">
                <ListItemButton className="sidebar-nav-item" onClick={() => handleNav(id)}>
                  <ListItemIcon>{icon}</ListItemIcon>
                  {!collapsed && <ListItemText primary={label} />}
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        </nav>

        <div className="sidebar-footer">
          <Avatar className="sidebar-avatar">{displayName[0]?.toUpperCase()}</Avatar>
          {!collapsed && (
            <div className="sidebar-account">
              <Typography noWrap>{displayName}</Typography>
              <span>{roleLabels[role] || "Workspace"}</span>
            </div>
          )}
          <IconButton aria-label="Sign out" onClick={handleLogout}><LogoutRoundedIcon /></IconButton>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <Typography component="h1">{title || roleLabels[role]}</Typography>
            <span className="connection-state"><i className={isConnected ? "is-live" : ""} />{isConnected ? "Live" : "Offline"}</span>
          </div>
          <Button className="command-trigger" variant="outlined" startIcon={<SearchRoundedIcon />} onClick={() => setPaletteOpen(true)}>
            <span>Search or jump</span>
            <kbd>Ctrl K</kbd>
          </Button>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>

      <nav className="mobile-dashboard-nav" aria-label="Mobile dashboard navigation">
        {navItems.slice(0, 4).map(([label, id, icon]) => (
          <button key={id} type="button" onClick={() => handleNav(id)}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} role={role} />
    </Box>
  );
}
