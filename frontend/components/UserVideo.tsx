import { Box, Button, colors, Slider, Stack, Typography } from "@mui/material";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import common from "../src/commons";
import { MainScreenUser, Stream, User } from "../types/video";
import EmptyVideo from "./EmptyVideo";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";

type VideoProps = {
  user: User;
  stream?: Stream;
  muted: boolean;
  render?: boolean;
  setMainScreenUser: (user_id: number) => void;
};
const isVideoUserSame = (prev: VideoProps, next: VideoProps) => {
  return (
    prev.user.user_id === next.user.user_id &&
    prev.stream?.stream === next.stream?.stream &&
    prev.render === next.render &&
    prev.user.onStream.audio === next.user.onStream.audio &&
    prev.user.onStream.video === next.user.onStream.video
  );
};

const UserVideo = ({
  user,
  stream,
  muted,
  render,
  setMainScreenUser,
}: VideoProps) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState<boolean>(muted);
  const [volume, setVolume] = useState<number>(80);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  useEffect(() => {
    const forReturn = ref;
    if (ref.current && stream?.stream) {
      ref.current.srcObject = null;
      ref.current.srcObject = stream.stream;
      ref.current.volume = volume / 100;
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
  }, [stream?.stream, muted, user.onStream.video, user.onStream.audio]);
  const onVolumeChange = (e: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
    if (ref.current) {
      ref.current.volume = (newValue as number) / 100;
    }
  };
  return (
    <Box
      onClick={() => {
        setMainScreenUser(user.user_id);
      }}
      sx={{
        ...common.smallVideo,
        position: "relative",
        marginBottom: 2,
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          visibility: modalOpen ? "visible" : "hidden",
          position: "absolute",
          border: "1px solid red",
          left: -common.smallVideo.height,
          height: 200,
          margin: 1,
          padding: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <VolumeDown />
        <Slider
          orientation="vertical"
          aria-label="Volume"
          value={volume}
          onChange={onVolumeChange}
        />
        <VolumeUp />
      </Box>
      <Button
        onClick={() => {
          setIsMuted(!isMuted);
        }}
        sx={{
          position: "absolute",
          right: 0,
          bottom: 0,
          zIndex: 20,
        }}
      >
        {isMuted ? "언뮤트" : "뮤트"}
      </Button>
      <Button
        onClick={() => {
          setModalOpen(!modalOpen);
        }}
        sx={{
          position: "absolute",
          left: 0,
          bottom: 0,
          zIndex: 20,
        }}
      >
        설정
      </Button>
      {user.onStream.video ? (
        <video
          ref={ref}
          muted={isMuted}
          autoPlay
          style={{
            ...common.smallVideo,
            backgroundColor: "black",
            zIndex: 10,
          }}
        />
      ) : (
        <EmptyVideo word={user.user_name.substring(0, 1)} />
      )}
    </Box>
  );
};
// UserVideo.displayName == "UserVideo";
export default UserVideo;
