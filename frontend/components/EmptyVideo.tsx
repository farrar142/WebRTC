import { Box, colors, Typography } from "@mui/material";
import React from "react";
type EmptyVideoProps = {
  word: string;
  color?: string;
};
const EmptyVideo: React.FC<EmptyVideoProps> = ({ word, color }) => {
  return (
    <Box
      sx={{
        margin: 0,
        padding: 0,
        width: "100%",
        height: "100%",
        bordrRadius: 5,
        backgroundColor: color ? color : colors.grey[900],
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        style={{
          width: "25%",
          aspectRatio: "1",
          borderRadius: "100%",
          backgroundColor: colors.blueGrey[200],
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography sx={{ fontWeight: 500 }}>{word?.toUpperCase()}</Typography>
      </Box>
    </Box>
  );
};

export default EmptyVideo;
