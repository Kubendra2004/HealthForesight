import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1769aa", dark: "#0b5fa5", contrastText: "#ffffff" },
    secondary: { main: "#12a594", dark: "#087d70", contrastText: "#ffffff" },
    background: { default: "#f3f8fc", paper: "#ffffff" },
    text: { primary: "#1e293b", secondary: "#64748b" },
    divider: "#dbe6ef",
    error: { main: "#b42318" },
    warning: { main: "#b54708" },
    success: { main: "#067647" },
    info: { main: "#175cd3" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Nunito Sans", "Inter", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Nunito Sans", "Inter", sans-serif', fontWeight: 800 },
    h3: { fontFamily: '"Nunito Sans", "Inter", sans-serif', fontWeight: 800 },
    h4: { fontFamily: '"Nunito Sans", "Inter", sans-serif', fontWeight: 800 },
    h5: { fontFamily: '"Nunito Sans", "Inter", sans-serif', fontWeight: 800 },
    h6: { fontFamily: '"Nunito Sans", "Inter", sans-serif', fontWeight: 800 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#f3f8fc" },
        ":focus-visible": { outline: "3px solid #1769aa", outlineOffset: "2px" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 999, transition: "150ms ease" },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiCard: {
      styleOverrides: { root: { border: "1px solid #dbe6ef", borderRadius: 14, boxShadow: "0 8px 24px rgba(30,72,104,0.07)" } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10, backgroundColor: "#ffffff" } },
    },
    MuiTableHead: {
      styleOverrides: { root: { "& .MuiTableCell-root": { backgroundColor: "#f8faf9", fontWeight: 700 } } },
    },
    MuiTableRow: { styleOverrides: { root: { height: 44 } } },
  },
});
