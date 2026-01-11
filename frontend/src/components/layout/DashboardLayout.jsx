import React from "react";
import { Box } from "@mui/material";
import DashboardNavbar from "./DashboardNavbar";

const DashboardLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#fafbfc",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Main Content - Absolutely Full Width, Zero Padding */}
      <Box
        component="main"
        sx={{
          mt: 8,
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <Box sx={{ px: 2, py: 2, width: "100%" }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
