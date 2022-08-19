import {
  Box,
  Button,
  colors,
  Dialog,
  DialogContent,
  Drawer,
  styled,
  SwipeableDrawer,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import {
  FormEventHandler,
  UIEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react';
import { BASE } from '../../src/urls';
import {
  ChatType,
  StreamSources,
  User,
  WsMessage,
  WsOrder,
} from '../../types/video';
import { InputTextField } from '../CssTextField';
type ChatBoxProps = {
  me: User;
};
const ChatBox: React.FC<ChatBoxProps> = ({ me }) => {
  const [show, setShow] = useState(false);
  const chatRef = useRef<ChatType[]>([]);
  const [chats, _setChats] = useState<ChatType[]>([]);
  const [chatScroll, setChatScroll] = useState(false);
  const setChats = (_chats: ChatType[]) => {
    chatRef.current = _chats;
    _setChats(_chats);
  };
  const [ws, setWs] = useState<WebSocket>();
  const router = useRouter();
  const WS_BASE = `wss://${BASE}/chat/${router.query.room}/${me.user_id}/`;

  useEffect(() => {
    if (ws == null) {
      const _ws = new WebSocket(WS_BASE);
      setWs(_ws);
      return () => _ws.close();
    }
  }, []);

  useEffect(() => {
    if (!ws) return;
    ws.onclose = () => {
      const reConnect = () => {
        const timeout = setTimeout(() => {
          console.log('챗소켓 재연결중');
          const _ws = new WebSocket(WS_BASE);
          _ws.onopen = () => {
            setWs(_ws);
            console.log('챗소켓연결됨!');
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
    ws.onmessage = (e: MessageEvent) => {
      const message = JSON.parse(e.data) as WsMessage;
      const order = message.order;
      console.log(message);
      switch (order) {
        case 'send_message':
          onReceiveChat(message);
          return;
        case 'prev_chats':
          onLoadChat(message);
      }
    };
  }, [ws]);
  const wsMessage = (
    target_id: number,
    order: WsOrder,
    data: any = '',
    request_source: keyof StreamSources
  ) => {
    const msg = {
      order,
      data,
      sender_on_stream: {
        audio: false,
        video: false,
      },
      sender_name: me.user_name,
      sender: me.user_id,
      receiver: target_id,
      request_source: request_source,
    } as WsMessage;
    if (ws) {
      ws.send(JSON.stringify(msg));
    }
  };
  const sendChat = (e: React.FormEvent<HTMLFormElement>): boolean => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const message = form.get('chat');
    e.currentTarget.reset();
    if (message) {
      wsMessage(0, 'send_message', message, 'video');
    }
    return message ? true : false;
  };

  const onLoadChat = ({ sender, sender_name, data }: WsMessage) => {
    setChats([...chatRef.current, ...data]);
    checkScroll();
  };

  const onReceiveChat = ({ sender, sender_name, data }: WsMessage) => {
    setChats([...chatRef.current, { sender, sender_name, message: data }]);
    checkScroll();
  };

  const checkScroll = () => {
    const el = document.getElementById('chatField');
    if (el) {
      const 마지막차일드 = el.lastElementChild;
      const 채팅크기 = 마지막차일드?.clientHeight || 0;
      const 대상크기 = el.offsetHeight;
      const 전체크기 = el.scrollHeight;
      const 현재위치 = el.scrollTop;
      const 대상값 = 현재위치 + 대상크기;
      if (대상값 + 채팅크기 * 10 >= 전체크기) {
        el.scrollTop = el.scrollHeight;
      } else {
        console.log('스크롤을 내릴까요?');
        if (chatScroll === false) {
          setChatScroll(true);
        }
      }
    }
  };

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event &&
        event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
      ) {
        return;
      }

      setShow(open);
    };
  const handleChat = (e: React.FormEvent<HTMLFormElement>) => {
    const el = document.getElementById('chatField');
    if (sendChat(e) && el) {
      const height = el.scrollHeight;
      el.scrollTop = height;
      console.log('scroll!');
    }
  };
  const onScroll = () => {
    const el = document.getElementById('chatField');
  };
  return (
    <>
      <Box
        id={'chatBoxOpen'}
        sx={{
          position: 'absolute',
          left: 0,
          height: '100vh',
          width: '5%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Button
          onClick={toggleDrawer(true)}
          sx={{
            position: 'absolute',
            // left: show ? 350 : 0,
            transition: 'left 300ms, right 300ms',
            zIndex: 50,
          }}
        >
          채팅!
        </Button>
      </Box>
      <SwipeableDrawer
        anchor='left'
        open={show}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        sx={{ cursor: 'default' }}
        disableBackdropTransition={true}
        disableDiscovery={true}
      >
        <Box
          // onClick={toggleDrawer(false)}
          // onKeyDown={toggleDrawer(false)}
          sx={{
            width: 350,
            height: '100% ',
            // position: "absolute",
            zIndex: 200,
            top: 0,
            left: 0,
            backgroundColor: colors.grey[900],
            transition: 'background 300ms, color 300ms, visibility 300ms',
            cursor: 'default',
          }}
        >
          <Box sx={{ padding: 2, height: '10%' }}>
            <Typography variant='h5' color='white'>
              Chatting
            </Typography>
          </Box>
          <Box
            id='chatField'
            onScroll={onScroll}
            sx={{
              overflow: 'scroll',
              height: '75%',
              paddingX: 2,
              marginBottom: 2,
            }}
          >
            {chats.map((chat, index, arr) => {
              const first =
                index === 0 ? true : arr[index - 1].sender !== chat.sender;
              const isMine = me.user_id === chat.sender;
              return (
                <Box
                  key={index}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    margin: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {first && !isMine && (
                      <Box>
                        <Typography color='white'>
                          {chat.sender_name}
                        </Typography>
                      </Box>
                    )}
                    <Box
                      style={{
                        backgroundColor: colors.grey[600],
                        borderRadius: '10%',
                        padding: 1,
                      }}
                    >
                      <Typography
                        sx={{ marginX: 1, marginY: 0.5 }}
                        color='white'
                      >
                        {chat.message}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Box
            id='chatInput'
            component='form'
            onSubmit={handleChat}
            sx={{
              width: '100%',
              height: '10%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              bottom: 20,
              padding: 2,
            }}
          >
            <Box
              sx={{
                display: chatScroll ? 'block' : 'none',
                position: 'absolute',
                bottom: 80,
                cursor: 'pointer',
              }}
              onClick={() => {
                const el = document.getElementById('chatField');
                if (el) {
                  el.scrollTop = el.scrollHeight;
                  setChatScroll(false);
                }
              }}
            >
              <Typography>내릴까?</Typography>
            </Box>
            <InputTextField
              // variant="filled"
              color='primary'
              id='chat'
              name='chat'
              label='메시지 입력'
              autoComplete='off'
            />
            <Button type='submit'>보내기</Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
};

export default ChatBox;
