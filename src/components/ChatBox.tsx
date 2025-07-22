import React, { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { chatApi, ChatMessageDTO, ChatMessageRequest } from '../api/chatApi';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

interface Props {
  roomId: string;
  messages: ChatMessageDTO[];
}

const ChatBox: React.FC<Props> = ({ roomId, messages }) => {
  const [input, setInput] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<any>(null);
  const stompClient = useRef<Client | null>(null);

  const userId = Number(sessionStorage.getItem('userId'));
  const token = sessionStorage.getItem('token');

  const connectSocket = () => {
    const socket = new SockJS('http://localhost:8083/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/messages/${roomId}`, (msg) => {
          const data = JSON.parse(msg.body);
          setTimeout(() => scrollToBottom(), 100);
        });
      },
    });
    client.activate();
    stompClient.current = client;
  };

  useEffect(() => {
    connectSocket();
    fetchMessages(0);
    return () => {
      stompClient.current?.deactivate();
    };
  }, [roomId]);

  const fetchMessages = async (pageNum: number) => {
    debugger
    const res = await chatApi.getMessages(roomId, pageNum);
    const data = res.data;
    if (!Array.isArray(data) || data.length === 0) {
      setHasMore(false);
    } else {
      setPage(pageNum);
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const handleSend = async () => {
    const payload: ChatMessageRequest = {
      chatRoomId: roomId,
      sessionId: roomId,
      userId,
      message: input,
      senderType: 'USER',
    };
    await chatApi.sendMessage(payload);
    setInput('');
  };

  const scrollToBottom = () => {
    listRef.current?.scrollToItem(messages.length - 1);
  };

  return (
    <div className="chat-box">
      <List
        height={window.innerHeight - 200}
        itemCount={messages.length}
        itemSize={60}
        width={'100%'}
        ref={listRef}
      >
        {({ index, style }) => {
          const msg = messages[index];
          return (
            <div style={style} className={`chat-message ${msg.senderType.toLowerCase()}`}>
              <div className="bubble">{msg.content}</div>
              <div className="timestamp">{msg.timestamp}</div>
            </div>
          );
        }}
      </List>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={handleSend}>Gửi</button>
      </div>
    </div>
  );
};

export default ChatBox;
