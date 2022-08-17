import { Box, colors } from "@mui/material";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import useWindowSize from "../hooks/useWindowSize";
import { MainScreenUser, Stream, User } from "../types/video";
import EmptyVideo from "./EmptyVideo";

type MainVideoProps = {
  user: MainScreenUser;
  muted: boolean;
};

const MainVideo: React.FC<MainVideoProps> = ({ user, muted }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const size = useWindowSize();
  const ratio = size.height / videoSize.height;
  const nowUser = user.user;

  useEffect(() => {
    const forReturn = ref;
    if (ref.current && user.stream?.stream) {
      ref.current.srcObject = null;
      ref.current.srcObject = user.stream.stream;
      console.log(user.stream.stream);
      const { width, height } = user.stream.stream
        .getVideoTracks()[0]
        .getSettings();
      if (width && height) {
        setVideoSize({ width, height });
      }
    } else {
      if (ref.current) {
        ref.current.srcObject = null;
      }
    }
    if (muted) setIsMuted(muted);
    return () => {
      if (forReturn.current) {
        forReturn.current.srcObject = null;
      }
    };
  }, [
    user.stream?.stream,
    muted,
    user.user.onStream?.video,
    user.user.onStream?.video,
    user.user,
    user,
  ]);

  console.log(ref.current?.srcObject);
  return (
    <Box
      id={"mainVideo"}
      sx={{
        // width: videoSize.width ? videoSize.width * ratio : "100%",
        // height: videoSize.width ? videoSize.height * ratio : "100%",
        height: "100%",
        margin: 0,
        padding: 0,
        backgroundColor: "black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {nowUser.onStream?.video ? (
        <video
          ref={ref}
          muted={isMuted}
          autoPlay
          width={videoSize.width * ratio || "100%"}
          height={videoSize.height * ratio || "100%"}
        />
      ) : (
        <EmptyVideo word={user.user.user_name} color={colors.common.black} />
      )}
    </Box>
  );
};

export default MainVideo;
