/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Button, colors, Stack, TextField } from "@mui/material";
import axios from "axios";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { API_BASE } from ".";
import ChatBox from "../components/chatting/ChatBox";
import StreamController from "../components/controller/StreamController";
import { InputTextField } from "../components/CssTextField";
import MainVideo from "../components/MainVideo";
import UserVideo from "../components/UserVideo";
import useController from "../src/controller";
import { User } from "../types/video";

const BASE = "webrtcbackend.honeycombpizza.link";

const Room: NextPage = () => {
  const router = useRouter();
  const roomname = router.query.room;
  const [username, setUsername] = useState<string>(
    Math.random().toString(36).substr(2, 11)
  );
  const [userId, setUserId] = useState<number>(0);
  const [show, setShow] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await axios.get(
      API_BASE + `/participate?roomname=${roomname}&username=${username}`
    );
    if (result.data) {
      setUserId(result.data);
    } else {
      alert("참가자가 이미 있어요");
    }
  };

  useEffect(() => {
    // if (buttonRef.current) buttonRef.current.click();
  }, [buttonRef]);

  return (
    <Box style={{ backgroundColor: "black", height: "100vh", width: "100vw" }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        style={{ paddingTop: 10, display: userId ? "none" : "block" }}
      >
        <InputTextField
          label="이름을 입력해주세요"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button ref={buttonRef} type="submit">
          확인
        </Button>
      </Box>
      {/* {show && <RTCViewer id={username} />} */}
      {userId > 0 && (
        <RTCContainer
          me={{
            user_name: username,
            user_id: userId,
            connected: false,
            onStream: {
              audio: false,
              video: false,
            },
          }}
        />
      )}
    </Box>
  );
};
type RTCContainerProps = {
  me: User;
};
//1.방에 접속하면 내 자신이 보여야됨.
//2.처음 접속하면 api를 통해서 내ID를 받아와야됨
//3.RedisCache를 사용하여 ID를 받아올것임
//4.웹소켓에 연결후 웹소켓 채널에 연결하고, RedisCache에 기록된 Room에 자신을 등록
//5.다른 사람이 입장시, 컴포넌트 생성
//6.다른 사람이 퇴장시 컴포넌트 제거
const RTCContainer: React.FC<RTCContainerProps> = ({ me }) => {
  const router = useRouter();
  const WS_BASE = `wss://${BASE}/ws/${router.query.room}/${me.user_id}/`;
  const ctl = useController(me, WS_BASE);
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <StreamController
        forceRender={ctl.common.forceRender}
        getLocalStream={ctl.source.getLocalStream}
        createJoinSignal={ctl.ws.createJoinSignal}
        broadCastEndStream={ctl.source.broadCastEndStream}
      />
      <ChatBox me={me} />
      <MainVideo
        user={
          ctl.data.mainScreenUser === me.user_id
            ? {
                user: { ...me, onStream: ctl.ref.onStreamRef.current },
                stream: {
                  user_id: me.user_id,
                  stream: ctl.ref.localStreamRef.current,
                },
              }
            : {
                user:
                  ctl.ref.usersRef.current.filter(
                    (user) => user.user_id === ctl.data.mainScreenUser
                  )[0] || me.user_id,
                stream: ctl.ref.remoteStreamsRef.current.filter(
                  (stream) => stream.user_id == ctl.data.mainScreenUser
                )[0] || {
                  user_id: me.user_id,
                  stream: ctl.ref.localStreamRef.current,
                }, //유저가 나가면 해당 레퍼런스가 닫히기 때문에 예외처리
              }
        }
        muted={true}
      />
      <Stack
        sx={{
          height: "100%",
          position: "absolute",
          right: 0,
          top: 0,
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          padding: 2,
          paddingTop: 3,
          transition: "background 300ms, color 300ms",
          "&:hover": {
            backgroundColor: colors.grey[800],
          },
        }}
      >
        <UserVideo
          user={{ ...me, onStream: ctl.ref.onStreamRef.current }}
          stream={{
            user_id: me.user_id,
            stream: ctl.ref.localStreamRef.current,
          }}
          setMainScreenUser={ctl.common.setMainScreenUser}
          muted={true}
        />
        {ctl.data.users.map((user) => (
          <UserVideo
            key={user.user_id}
            user={user}
            stream={
              ctl.data.remoteStreams.filter(
                (stream) => stream.user_id === user.user_id
              )[0]
            }
            setMainScreenUser={ctl.common.setMainScreenUser}
            muted={true}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default Room;
