import React from "react";
import { Box } from "@mui/material";

const DashboardLayout = ({ children, title, role }) => {
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
          mt: 0,
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
