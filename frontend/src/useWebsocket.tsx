/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { User, WsMessage } from "../types/video";
import { webSocketAtom } from "./atom";

export function useWebSocket(url: string, name: string = "rtc") {
  const [ws, setWs] = useRecoilState(webSocketAtom(url));
  useEffect(() => {
    if (ws == null) {
      const _ws = new WebSocket(url);
      setWs(_ws);
    }

    return () => {
      // ws.close();
      console.log("웹소켓닫힘");
      if (ws) {
        ws.close();
      }
    };
  }, [url]);
  useEffect(() => {
    if (ws) {
      ws.onclose = () => {
        const reConnect = () => {
          const timeout = setTimeout(() => {
            console.log(`${name}소켓 재연결중`);
            const _ws = new WebSocket(url);
            _ws.onopen = () => {
              setWs(_ws);
              console.log(`${name}소켓 연결됨!`);
              clearTimeout(timeout);
            };
            _ws.onclose = () => {
              clearTimeout(timeout);
              reConnect();
            };
          }, 1000);
        };
        reConnect();
      };
    }
  }, [ws]);
  return ws;
}

export const useUsersWebSocket = (
  me: User,
  _users: User[],
  url: string,
  joinRoom: () => void,
  regist_user_infos: (message: WsMessage) => void,
  getOffer: (message: WsMessage) => Promise<void>,
  getAnswer: (message: WsMessage) => Promise<void>,
  getCandidate: (message: WsMessage) => Promise<void>,
  exitUser: (message: WsMessage) => Promise<void>,
  registVideoInfo: (message: WsMessage) => void,
  onUserStartStream: (message: WsMessage) => void,
  onUserEndStream: (message: WsMessage) => void
) => {
  const ws = useWebSocket(url);
  useEffect(() => {
    ws.onopen = () => {
      joinRoom();
    };
    ws.onmessage = (e: MessageEvent) => {
      const users = [..._users];
      const message = JSON.parse(e.data) as WsMessage;
      const order = message.order;
      switch (order) {
        case "user_infos":
          regist_user_infos(message);
          return;
        case "regist_video_info":
          registVideoInfo(message);
          return;
        case "exit_user":
          exitUser(message);
          return;
        case "get_offer":
          if (message.receiver == me.user_id) {
            getOffer(message);
          }
          return;
        case "get_answer":
          if (message.receiver == me.user_id) {
            getAnswer(message);
          }
          return;
        case "get_candidate":
          if (message.receiver == me.user_id) {
            getCandidate(message);
          }
          return;
        case "start_stream":
          onUserStartStream(message);
          return;
        case "end_stream":
          onUserEndStream(message);
          return;
        // case 'send_message':
        //   onReceiveChat(message);
        //   return;
      }
    };
  }, []);
  return ws;
};
