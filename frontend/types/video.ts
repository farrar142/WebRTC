type MediaType = {
  audio: boolean;
  video: boolean;
};
export type StreamSources = {
  [key in keyof MediaType]: MediaType[key];
};

export type User = {
  user_name: string;
  user_id: number;
  connected: boolean;
  onStream: StreamSources;
  // stream?: MediaStream;
};

export type WsMessage = {
  order: wsRecivedOrder;
  sender_on_stream: StreamSources;
  sender_name: string;
  sender: number;
  receiver: number;
  request_source: keyof MediaType;
  data: any;
};
export type ReceivedUser = {
  user_name: string;
  user_id: number;
  on_stream: StreamSources;
};
export type Stream = {
  user_id: number;
  stream?: MediaStream;
};
export type MainScreenUser = {
  user: User;
  stream?: Stream;
};
export type SourceType = 'screen' | 'camera' | 'chatting';
export type WsOrder =
  | 'regist_information'
  | 'offer'
  | 'answer'
  | 'candidate'
  | 'join'
  | 'start_stream'
  | 'end_stream'
  | 'send_message';
export type wsRecivedOrder =
  | WsOrder
  | 'regist_video_info'
  | 'exit_user'
  | 'get_offer'
  | 'get_answer'
  | 'get_candidate'
  | 'user_infos'
  | 'prev_chats';
export type ChatType = {
  sender: number;
  sender_name: string;
  message: string;
};
