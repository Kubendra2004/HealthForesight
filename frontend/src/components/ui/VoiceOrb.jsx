import { useState } from "react";
import { Box, IconButton, Switch, Typography } from "@mui/material";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CarePulse from "./CarePulse";

export default function VoiceOrb({ transcript = "", contextShared = false, onContextChange }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState("idle");
  return (
    <>
      {open && (
        <Box className="voice-assistant-panel" role="dialog" aria-label="Health assistant">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Care assistant</Typography>
            <IconButton aria-label="Close assistant" onClick={() => setOpen(false)}><CloseRoundedIcon /></IconButton>
          </Box>
          <Box sx={{ display: "grid", placeItems: "center", py: 1 }}>
            <CarePulse size={72} pulse={state !== "idle"} />
            <Typography variant="caption" sx={{ mt: 1, color: "text.secondary", textTransform: "capitalize" }}>{state}</Typography>
          </Box>
          <Typography variant="h6" sx={{ minHeight: 52, lineHeight: 1.45 }}>{transcript || "Tap the microphone and ask a care question."}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
            <Typography variant="caption" color="text.secondary">Share current patient context</Typography>
            <Switch checked={contextShared} onChange={(event) => onContextChange?.(event.target.checked)} inputProps={{ "aria-label": "Share patient context" }} />
          </Box>
        </Box>
      )}
      <IconButton
        className="voice-assistant-orb"
        aria-label={open ? "Close voice assistant" : "Open voice assistant"}
        onClick={() => {
          setOpen((value) => !value);
          setState(open ? "idle" : "listening");
        }}
      >
        {open ? <CarePulse size={52} pulse /> : <MicRoundedIcon />}
      </IconButton>
    </>
  );
}
