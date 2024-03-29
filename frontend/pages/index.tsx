import { Stream } from "@mui/icons-material";
import { Box, Button, Container, TextField } from "@mui/material";
import axios from "axios";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { InputTextField } from "../components/CssTextField";

export const API_BASE = `https://webrtcbackend.honeycombpizza.link/api`;

const Room: NextPage = () => {
  const [roomname, setRoomname] = useState<string>("test");
  const router = useRouter();
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push({
      pathname: `/[room]`,
      query: {
        room: roomname,
      },
    });
  };
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      style={{
        paddingTop: 10,
        backgroundColor: "black",
        height: "100vh",
        width: "100vw",
      }}
    >
      <InputTextField
        label="roomname"
        placeholder="roomname"
        onChange={(e) => {
          setRoomname(e.target.value);
        }}
        value={roomname}
      />
      <Button type="submit">확인</Button>
    </Box>
  );
};
export default Room;
