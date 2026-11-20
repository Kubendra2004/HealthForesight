import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f766e", dark: "#115e59", contrastText: "#ffffff" },
    secondary: { main: "#2dd4bf", dark: "#0d9488", contrastText: "#071b1c" },
    background: { default: "#f4f8f7", paper: "#ffffff" },
    text: { primary: "#16302d", secondary: "#5d706d" },
    divider: "#dce7e3",
    error: { main: "#b42318" },
    warning: { main: "#b54708" },
    success: { main: "#067647" },
    info: { main: "#175cd3" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Outfit", "Inter", sans-serif', fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#f4f8f7" },
        ":focus-visible": { outline: "3px solid #2dd4bf", outlineOffset: "2px" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 10, transition: "150ms cubic-bezier(0.22, 1, 0.36, 1)" },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiCard: {
      styleOverrides: { root: { border: "1px solid #dce7e3", borderRadius: 12, boxShadow: "0 1px 2px rgba(7,27,28,0.04)" } },
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
