import { Card, CardContent } from "@mui/material";

export default function FlatCard({ children, sx, contentSx, ...props }) {
  return (
    <Card sx={{ height: "100%", ...sx }} {...props}>
      <CardContent sx={{ height: "100%", p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}
