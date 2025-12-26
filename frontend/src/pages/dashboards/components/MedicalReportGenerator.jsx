import React from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import { Download } from "@mui/icons-material";

const MedicalReportGenerator = ({ patientId, patientName, onGenerate }) => {
  const [generating, setGenerating] = React.useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      if (onGenerate) {
        await onGenerate();
      } else {
         // Fallback or legacy logic (optional, but for now we rely on prop)
         alert("Report generation not configured.");
      }
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="700">
            🏥 Medical Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate a comprehensive health summary
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleGenerate}
          disabled={generating}
          sx={{ borderRadius: 2 }}
        >
          {generating ? "Generating..." : "Generate"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MedicalReportGenerator;
