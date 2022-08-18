import { Box, Button } from "@mui/material";
import { SourceType, StreamSources } from "../../types/video";
type StreamControllerProps = {
  forceRender: () => void;
  getLocalStream: (type: SourceType) => Promise<boolean>;
  createJoinSignal: (type: keyof StreamSources) => void;
  broadCastEndStream: (type: keyof StreamSources) => void;
};
const StreamController: React.FC<StreamControllerProps> = ({
  forceRender,
  getLocalStream,
  createJoinSignal,
  broadCastEndStream,
}) => {
  return (
    <Box sx={{ position: "absolute", zIndex: 100, width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button
          onClick={() => {
            getLocalStream("screen").then((res) => createJoinSignal("video"));
          }}
        >
          현재화면
        </Button>
        <Button
          onClick={() => {
            getLocalStream("camera").then((res) => createJoinSignal("video"));
          }}
        >
          카메라
        </Button>
        <Button onClick={() => broadCastEndStream("audio")}>음성종료</Button>
        <Button onClick={() => broadCastEndStream("video")}>방송종료</Button>
      </Box>
    </Box>
  );
};
export default StreamController;
