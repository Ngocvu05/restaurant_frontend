import React, { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { chatApi, ChatMessageDTO, ChatMessageRequest } from '../api/chatApi';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import '../assets/css/ChatPage.css';

interface Props {
  roomId: string;
  messages: ChatMessageDTO[];
}

const ChatBox: React.FC<Props> = ({ roomId, messages }) => {
  const [input, setInput] = useState('');
  const [allMessages, setAllMessages] = useState<ChatMessageDTO[]>([]);
  const listRef = useRef<any>(null);
  const stompClient = useRef<Client | null>(null);

  const userId = Number(sessionStorage.getItem('userId'));

  useEffect(() => {
    setAllMessages(messages);
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
  const socket = new SockJS('http://localhost:8083/ws');
  const client = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(`/topic/messages/${roomId}`, (msg) => {
        const data = JSON.parse(msg.body);
        setAllMessages((prev) => [...prev, data]);
        scrollToBottom();
      });
    },
  });

  client.activate();
  stompClient.current = client;

  return () => {
    stompClient.current?.deactivate(); // ✅ return cleanup (void)
  };
}, [roomId]);

  const handleSend = async () => {
    if (!input.trim()) return;
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
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToItem(allMessages.length - 1);
      }
    }, 100);
  };

  return (
    <div className="chat-box">
      <List
        height={window.innerHeight - 200}
        itemCount={allMessages.length}
        itemSize={60}
        width={'100%'}
        ref={listRef}
      >
        {({ index, style }) => {
          const msg = allMessages[index];
          return (
            <div style={style} className={`chat-message ${msg.senderType.toLowerCase()}`}>
              <div className="bubble">{msg.content}</div>
              <div className="timestamp">{msg.createdAt}</div>
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
