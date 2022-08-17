import { Box } from "@mui/material";
import { MutableRefObject, useCallback, useRef, useState } from "react";
import {
  ChatType,
  ReceivedUser,
  SourceType,
  Stream,
  StreamSources,
  User,
  WsMessage,
  WsOrder,
} from "../../types/video";
import { useUsersWebSocket } from "../useWebsocket";

const pcConfig = {
  iceServers: [
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};
const emptyUser: ReceivedUser = {
  user_id: 0,
  user_name: "",
  on_stream: {
    video: false,
    audio: false,
  },
};

const useController = (me: User, ws_url: string) => {
  const [users, _setUsers] = useState<User[]>([]);
  const render = useRef<boolean>(false);
  const [_render, _forceRender] = useState(false);
  const usersRef = useRef<User[]>([]);
  const remoteStreamsRef = useRef<Stream[]>([]);
  const [remoteStreams, setStreams] = useState<Stream[]>([]);
  const onStreamRef = useRef<StreamSources>(me.onStream);
  const [_onstream, _setOnstream] = useState(onStreamRef.current);
  const localStreamRef = useRef<MediaStream>();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const audioStreamRef = useRef<MediaStream>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const pcsRef = useRef<{
    audio: { [userId: string]: RTCPeerConnection };
    video: { [userId: string]: RTCPeerConnection };
  }>({ audio: {}, video: {} });
  const [mainScreenUser, setMainScreenUser] = useState<number>(me.user_id);

  //chat

  const wsMessage = (
    target_id: number,
    order: WsOrder,
    data: any = "",
    request_source: keyof StreamSources
  ) => {
    const msg = {
      order,
      data,
      sender_on_stream: onStreamRef.current,
      sender_name: me.user_name,
      sender: me.user_id,
      receiver: target_id,
      request_source: request_source,
    } as WsMessage;
    ws.send(JSON.stringify(msg));
  };
  const forceRender = () => {
    _forceRender(!render.current);
    render.current = !render.current;
  };
  const setUsers = (param: User[]) => {
    usersRef.current = param;
    _setUsers(usersRef.current);
  };

  const setRemoteStreams = (param: Stream[]) => {
    remoteStreamsRef.current = param;
    setStreams(remoteStreamsRef.current);
  };

  const setOnstream = (key: keyof StreamSources, param: boolean) => {
    onStreamRef.current[key] = param;
    _setOnstream(onStreamRef.current);
  };

  const joinRoom = () => {
    //방에 참여 시그널 발생
    wsMessage(emptyUser.user_id, "join", me, "audio");
  };
  const createJoinSignal = (key: keyof StreamSources) => {
    wsMessage(emptyUser.user_id, "regist_information", "", key);
  };
  const broadCastStartStream = useCallback((source: keyof StreamSources) => {
    // localStreamRef.current = undefined;
    wsMessage(0, "start_stream", "", source);
  }, []);

  const broadCastEndStream = (key: keyof StreamSources) => {
    const devices = navigator.mediaDevices;
    devices
      .getUserMedia({ video: true, audio: false })
      .then((res) => {
        localStreamRef.current?.getVideoTracks().forEach((track) => {
          console.log(track, "삭제");
          track.stop();
          res.removeTrack(track);
        });
      })
      .then(() => {
        onStreamRef.current[key] = false;
        for (let pc in pcsRef.current[key]) {
          console.log(pc, pcsRef.current[key]);
          pcsRef.current[key][pc].getSenders().forEach((sender) => {
            console.log(pc, "에 대한 브로드캐스트 종료");
            wsMessage(parseInt(pc, 10), "end_stream", "", key);
            pcsRef.current[key][pc].removeTrack(sender);
          });
          // curPc.close();
          // delete pcsRef.current[pc];
          forceRender();
        }
        localStreamRef.current = undefined;
      })
      .catch(() => {
        console.log("error?");
      });
  };
  const onUserStartStream = (message: WsMessage) => {
    const sender = message.sender;
    const isStream = message.sender_on_stream;
    setUsers([
      ...usersRef.current.map((user) => {
        if (user.user_id === sender) {
          return { ...user, onStream: isStream };
        }
        return user;
      }),
    ]);
    forceRender();
  };

  const onUserEndStream = (message: WsMessage) => {
    const sender = message.sender;
    const isStream = message.sender_on_stream;
    setUsers([
      ...usersRef.current.map((user) => {
        if (user.user_id === sender) {
          return { ...user, onStream: isStream };
        }
        return user;
      }),
    ]);
    forceRender();
  };

  const selectSource = (device: MediaDevices, source: SourceType) => {
    switch (source) {
      case "camera":
        return device.getUserMedia({
          video: true,
          audio: false,
        });
      default:
        return device.getDisplayMedia({
          video: true,
          audio: false,
        });
    }
  };

  const getAudioStream = useCallback((): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      selectSource(navigator.mediaDevices, "screen")
        .then((localStream) => {
          audioStreamRef.current = localStream;
          if (audioRef.current) {
            audioRef.current.srcObject = localStream;
          }
          forceRender();
          setOnstream("audio", true);
          broadCastStartStream("audio");
          resolve(true);
        })
        .catch((res) => reject(false));
    });
  }, [broadCastStartStream]);

  const getLocalStream = useCallback(
    (source: SourceType): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        selectSource(navigator.mediaDevices, source)
          .then((localStream) => {
            localStreamRef.current = localStream;
            if (localVideoRef.current) {
              navigator.mediaDevices
                .getUserMedia({ video: true, audio: false })
                .then((res) => {
                  localStreamRef.current?.getVideoTracks().forEach((track) => {
                    console.log(track, "삭제");
                    track.stop();
                    res.removeTrack(track);
                  });
                });
              localVideoRef.current.srcObject = localStream;
            }
            forceRender();
            setOnstream("video", true);
            broadCastStartStream("video");
            resolve(true);
          })
          .catch((res) => reject(false));
      });
    },
    [broadCastStartStream]
  );

  const createOffer = async (
    target: ReceivedUser,
    key: keyof StreamSources
  ): Promise<void> => {
    const pc = createPeerConnection(target, key);
    if (pcsRef.current[key][target.user_id]) {
      pcsRef.current[key][target.user_id].close();
      delete pcsRef.current[key][target.user_id];
    }
    deletePeerConnection(target.user_id, key);
    pcsRef.current[key] = { ...pcsRef.current[key], [target.user_id]: pc };
    const isVideo = key === "video";
    const localSdp = await pc.createOffer({
      offerToReceiveAudio: !isVideo,
      offerToReceiveVideo: isVideo,
    });
    await pc.setLocalDescription(new RTCSessionDescription(localSdp));
    wsMessage(target.user_id, "offer", localSdp, key);
    console.log(target.user_id, `로 향하는 ${key}오퍼 생성함`);
  };

  const deletePeerConnection = (
    target_id: number,
    key: keyof StreamSources
  ) => {
    try {
      const pc = pcsRef.current[key][target_id];
      if (pc) {
        pc.close();
        delete pcsRef.current[key][target_id];
      }
    } catch {}
  };

  const createPeerConnection = useCallback(
    (target: ReceivedUser, key: keyof StreamSources) => {
      const pc = new RTCPeerConnection(pcConfig);
      pc.onicecandidate = (e) => {
        if (!(ws && e.candidate)) {
          return;
        }
        console.log("onIceCandidate");
        wsMessage(target.user_id, "candidate", e.candidate, key);
      };

      pc.oniceconnectionstatechange = (e) => {
        // console.log(e);
      };

      pc.ontrack = (e) => {
        console.log(target.user_id, `로부터 온 ${key}트랙!`, e.streams);
        setRemoteStreams([
          ...remoteStreamsRef.current.filter(
            (stream) => stream.user_id !== target.user_id
          ),
          { user_id: target.user_id, stream: e.streams[0] },
        ]);
      };
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (!localStreamRef.current) {
            console.log(`${target.user_id}으로 향하는 ${key}트랙 추가안됨`);
            return;
          }
          console.log(`${target.user_id}으로 향하는 ${key}트랙 추가됨`);
          pc.addTrack(track, localStreamRef.current);
        });
      } else {
      }

      return pc;
    },
    []
  );

  const regist_user_infos = (message: WsMessage) => {
    const sender = message.sender; //참가자의 id
    const sender_name = message.sender_name;
    const receiver = message.receiver;
    const data = message.data as ReceivedUser[];
    if (sender == me.user_id) {
      console.log("조인시그널받음");
      createJoinSignal("video");
      createJoinSignal("audio");
      //스트림이 있는 상대들을 호출
    }
    //아무런 스트림없는 상대추가
    setUsers([
      ...usersRef.current,
      ...data
        .filter(
          (rcv) =>
            !filtered(
              rcv.user_id,
              [...usersRef.current.map((user) => user.user_id), me.user_id] //나와 기존유저들 제외
            )
        )
        .map((rcv) => {
          return {
            user_name: rcv.user_name,
            user_id: rcv.user_id,
            connected: false,
            onStream: rcv.on_stream,
          };
        }),
    ]);
  };

  const getOffer = async (message: WsMessage) => {
    // if (!localStreamRef.current) return; 본인의 스트림이 열려있지 않더라도 다른 사람이 받을 수 있게 주석처리.
    const source = message.request_source;
    getOfferFromSource(message, source);
  };

  const getOfferFromSource = async (
    message: WsMessage,
    key: keyof StreamSources
  ) => {
    //상대방의 오퍼를 등록
    const sdp = message.data as RTCSessionDescriptionInit;
    const sender = message.sender; //참가자의 id
    const sender_name = message.sender_name;
    const receiver = message.receiver;
    const isVideo = "video" === key;
    const pc = createPeerConnection(
      {
        user_id: sender,
        user_name: sender_name,
        on_stream: message.sender_on_stream,
      },
      key
    );
    if (!pc) return;
    deletePeerConnection(sender, key);
    pcsRef.current[key] = { ...pcsRef.current[key], [sender]: pc };
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const localSdp = await pc.createAnswer({
      offerToReceiveVideo: isVideo,
      offerToReceiveAudio: !isVideo,
    });
    await pc.setLocalDescription(new RTCSessionDescription(localSdp));
    wsMessage(message.sender, "answer", localSdp, key);
  };

  const getAnswer = async (message: WsMessage) => {
    //상대방이 오퍼를 받아들였으면 상대방의 sdp를 상대 피어커넥션에 등록
    const sender = message.sender; //원래있던자의 아이디
    const receiver = message.receiver;
    const source = message.request_source;
    const sdp = message.data as RTCSessionDescriptionInit;
    const pc: RTCPeerConnection = pcsRef.current[source][sender];
    if (!pc) return;
    pc.setRemoteDescription(new RTCSessionDescription(sdp));
  };

  const getCandidate = async (message: WsMessage) => {
    const sender = message.sender;
    const receiver = message.receiver;
    const source = message.request_source;
    const data = message.data as RTCIceCandidateInit | undefined;
    const pc: RTCPeerConnection = pcsRef.current[source][sender];
    if (!pc || !data) {
      return; // console.log("wrongSdp", pc, message);
    }
    await pc.addIceCandidate(new RTCIceCandidate(data));
  };

  const registVideoInfo = (message: WsMessage) => {
    const regist_users = message.data as ReceivedUser[];
    if (message.receiver == me.user_id) {
    } else if (message.sender !== me.user_id && message.receiver === 0) {
      //하나씩추가
      regist_users
        .filter((res) => res.user_id !== me.user_id)
        .map((res) => {
          console.log(`${res.user_id} ${message.request_source} 유저등록`);
          createOffer(res, message.request_source);
          // createOffer(res, "video");
        });
    }
  };

  const exitUser = async (message: WsMessage) => {
    const exit_user = message.data as ReceivedUser;
    if (pcsRef.current["audio"][exit_user.user_id]) {
      pcsRef.current["audio"][exit_user.user_id].close();
    }
    if (pcsRef.current["video"][exit_user.user_id]) {
      pcsRef.current["video"][exit_user.user_id].close();
    }
    setUsers([
      ...usersRef.current.filter((res) => res.user_id !== exit_user.user_id),
    ]);
  };

  const ws = useUsersWebSocket(
    me,
    users,
    ws_url,
    joinRoom,
    regist_user_infos,
    getOffer,
    getAnswer,
    getCandidate,
    exitUser,
    registVideoInfo,
    onUserStartStream,
    onUserEndStream
  );

  return {
    data: {
      mainScreenUser,
      users,
      remoteStreams,
    },
    ref: { onStreamRef, localStreamRef, usersRef, remoteStreamsRef },
    ws: {
      createJoinSignal,
      joinRoom,
      broadCastStartStream,
    },
    source: {
      getLocalStream,
      broadCastEndStream,
    },
    common: {
      forceRender,
      setMainScreenUser,
    },
  };
};
const filtered = (num: number, nums: number[]) => {
  //nums안에 num 이 있다면 true 반환
  return nums.filter((res) => res == num).length >= 1;
};
export default useController;
