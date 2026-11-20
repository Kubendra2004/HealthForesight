import React from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Avatar, Box, Button, Toolbar, Typography } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../../context/AuthContext";

const roleLabels = {
  patient: "Patient portal",
  doctor: "Care team",
  admin: "Administration",
  frontdesk: "Front desk",
};

export default function DashboardLayout({ children, title, role }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.username || "Account";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb", color: "#172033" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          color: "inherit",
          bgcolor: "rgba(255,255,255,0.94)",
          borderBottom: "1px solid #e5eaf2",
          backdropFilter: "blur(12px)",
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 60, sm: 68 }, px: { xs: 2, md: 4 }, gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "#e9edff", color: "#4657c8" }}>
            <FavoriteRoundedIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
              HealthForesight
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {title || roleLabels[role] || "Workspace"}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" }, maxWidth: 200 }} noWrap>
            {displayName}
          </Typography>
          <Button
            onClick={handleLogout}
            size="small"
            startIcon={<LogoutRoundedIcon />}
            sx={{ textTransform: "none", fontWeight: 700, color: "#475569" }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Sign out</Box>
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ width: "100%", maxWidth: 1760, mx: "auto", px: { xs: 1, sm: 2, lg: 3 }, py: { xs: 1.5, md: 2.5 }, boxSizing: "border-box" }}>
        {children}
      </Box>
    </Box>
  );
}
