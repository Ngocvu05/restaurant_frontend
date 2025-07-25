// ChatBox.tsx - Enhanced version with all features
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { chatApi, ChatMessageDTO, ChatMessageRequest } from '../api/chatApi';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useTheme } from '../pages/ChatPage';
import '../assets/css/Chat.css';

interface Props {
  roomId: string;
  initialMessages: ChatMessageDTO[];
}

// Enhanced message interface with new features
interface EnhancedChatMessage extends ChatMessageDTO {
  reactions?: { [emoji: string]: string[] }; // emoji -> user IDs
  isEdited?: boolean;
  replyTo?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

// Emoji picker data
const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  gestures: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'],
  objects: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐']
};

// Typing indicator component
const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
  if (users.length === 0) return null;
  
  return (
    <div className="typing-indicator-message">
      <div className="typing-avatar">AI</div>
      <div className="typing-bubble">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

// File upload component
const FileUpload: React.FC<{ onFileSelect: (file: File) => void }> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <>
      <button className="file-upload-btn" onClick={handleClick} title="Tải file lên">
        📎
      </button>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </>
  );
};

// Emoji picker component
const EmojiPicker: React.FC<{ onEmojiSelect: (emoji: string) => void; onClose: () => void }> = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');

  return (
    <div className="emoji-picker">
      <div className="emoji-categories">
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button
            key={cat}
            className={`emoji-category ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="emoji-grid">
        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map(emoji => (
          <button
            key={emoji}
            className="emoji-item"
            onClick={() => onEmojiSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <button className="emoji-close" onClick={onClose}>×</button>
    </div>
  );
};

// Enhanced message component with reactions and file support
const MessageItem = React.memo(({ index, style, message }: { 
  index: number; 
  style: React.CSSProperties; 
  message: EnhancedChatMessage;
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReaction = (emoji: string) => {
    // Handle reaction logic here
    console.log('Reaction:', emoji, 'to message:', message.content);
    setShowEmojiPicker(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (fileType?: string) => {
    return fileType?.startsWith('image/');
  };

  return (
    <div 
      style={{
        ...style,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }} 
      className={`chat-message ${message.senderType.toLowerCase()}`}
    >
      <div className="message-wrapper" style={{
        display: 'flex',
        flexDirection: message.senderType === 'USER' ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: '12px',
        width: '100%'
      }}>
        {/* Avatar */}
        <div className="avatar" style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: message.senderType === 'USER' ? '#007bff' : '#6c757d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          flexShrink: 0,
          fontWeight: 'bold'
        }}>
          {message.senderType === 'USER' ? 'U' : 'AI'}
        </div>
        
        {/* Message content */}
        <div className="message-content" style={{
          maxWidth: '65%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: message.senderType === 'USER' ? 'flex-end' : 'flex-start'
        }}>
          <div 
            className="bubble" 
            style={{
              backgroundColor: message.senderType === 'USER' ? '#007bff' : '#f1f3f5',
              color: message.senderType === 'USER' ? 'white' : '#333',
              padding: '12px 16px',
              borderRadius: '18px',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5',
              minHeight: '20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {/* File content */}
            {message.fileUrl && (
              <div className="file-content">
                {isImage(message.fileType) ? (
                  <img 
                    src={message.fileUrl} 
                    alt={message.fileName}
                    className="message-image"
                    style={{ maxWidth: '200px', borderRadius: '8px' }}
                  />
                ) : (
                  <div className="file-attachment">
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <div className="file-name">{message.fileName}</div>
                      <div className="file-size">{message.fileSize && formatFileSize(message.fileSize)}</div>
                    </div>
                    <button className="file-download">⬇️</button>
                  </div>
                )}
              </div>
            )}
            
            {/* Text content */}
            {message.content && (
              <div>
                {message.content}
                {message.isEdited && <span className="edited-indicator"> (đã chỉnh sửa)</span>}
              </div>
            )}

            {/* Message status for user messages */}
            {message.senderType === 'USER' && (
              <div className="message-status-icon">
                {message.messageStatus === 'SENT' && '✓'}
                {message.messageStatus === 'RECEIVED' && '✓✓'}
                {message.messageStatus === 'READ' && <span className="read-status">✓✓</span>}
              </div>
            )}

            {/* Reaction button */}
            {showReactions && (
              <button 
                className="reaction-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😊
              </button>
            )}
          </div>

          {/* Reactions display */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="message-reactions">
              {Object.entries(message.reactions).map(([emoji, userIds]) => (
                <span key={emoji} className="reaction-item">
                  {emoji} {userIds.length}
                </span>
              ))}
            </div>
          )}
          
          <div 
            className="timestamp" 
            style={{
              fontSize: '11px',
              color: '#6c757d',
              marginTop: '6px',
              padding: '0 8px'
            }}
          >
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="emoji-picker-overlay">
            <EmojiPicker 
              onEmojiSelect={handleReaction}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
});

const ChatBox: React.FC<Props> = ({ roomId, initialMessages }) => {
  const [messages, setMessages] = useState<EnhancedChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const listRef = useRef<any>(null);
  const stompClient = useRef<Client | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userId = Number(sessionStorage.getItem('userId'));
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemHeights = useRef<{ [key: number]: number }>({});
  const { isDark } = useTheme();

  // Dynamic height calculation
  const getItemHeight = (message: EnhancedChatMessage, width: number = 300): number => {
    const contentLength = message.content?.length || 0;
    let baseHeight = 80;
    
    // Add height for file attachments
    if (message.fileUrl) {
      if (message.fileType?.startsWith('image/')) {
        baseHeight += 150; // Image height
      } else {
        baseHeight += 60; // File attachment height
      }
    }
    
    // Add height for reactions
    if (message.reactions && Object.keys(message.reactions).length > 0) {
      baseHeight += 30;
    }
    
    const lineHeight = 20;
    const maxWidth = width - 100;
    const charsPerLine = Math.floor(maxWidth / 8);
    const estimatedLines = Math.ceil(contentLength / charsPerLine);
    
    const totalLines = Math.max(2, estimatedLines + 1);
    return Math.max(baseHeight, totalLines * lineHeight + 30);
  };

  const getItemHeightMemo = useCallback((index: number) => {
    if (itemHeights.current[index]) {
      return itemHeights.current[index];
    }
    
    if (messages[index]) {
      const height = getItemHeight(messages[index]);
      itemHeights.current[index] = height;
      return height;
    }
    
    return 100;
  }, [messages]);

  useEffect(() => {
    itemHeights.current = {};
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollToItem(messages.length - 1, 'end');
        }
      });
    }
  }, [messages.length]);

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    if (!listRef.current) return;
    
    const { height } = listRef.current.props;
    const totalHeight = messages.reduce((sum, _, index) => sum + getItemHeightMemo(index), 0);
    const isAtBottom = scrollOffset + height >= totalHeight - 100;
    
    setIsUserScrolling(!isAtBottom);
    setShouldAutoScroll(isAtBottom);
  }, [messages, getItemHeightMemo]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator to server
      if (stompClient.current?.connected) {
        stompClient.current.publish({
          destination: `/app/typing/${roomId}`,
          body: JSON.stringify({ userId, isTyping: true })
        });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (stompClient.current?.connected) {
        stompClient.current.publish({
          destination: `/app/typing/${roomId}`,
          body: JSON.stringify({ userId, isTyping: false })
        });
      }
    }, 3000);
  }, [isTyping, roomId, userId]);

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.');
      return;
    }

    setUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);
      
      // Upload file (you'll need to implement this API endpoint)
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const { fileUrl } = await uploadResponse.json();
      
      // Send message with file
      const payload: ChatMessageRequest = {
        chatRoomId: roomId,
        sessionId: roomId,
        userId,
        message: file.name,
        senderType: 'USER',
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };

      await chatApi.sendMessage(payload);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Không thể tải file lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
      setShouldAutoScroll(true);
    }
  }, [roomId]);

  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom();
      }, 100);
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages.length, shouldAutoScroll, isUserScrolling, scrollToBottom]);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8083/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to messages
        client.subscribe(`/topic/room/${roomId}`, (msg) => {
          const newMsg = JSON.parse(msg.body);
          const parsed: EnhancedChatMessage = {
            content: newMsg.response || newMsg.content,
            senderType: newMsg.senderType,
            senderName: newMsg.senderName || 'AI',
            createdAt: newMsg.createdAt || new Date().toISOString(),
            timestamp: newMsg.timestamp || new Date().toISOString(),
            messageStatus: newMsg.messageStatus || 'RECEIVED',
            messageType: newMsg.messageType || 'TEXT',
            isRead: true,
            response: newMsg.response || '',
            fileUrl: newMsg.fileUrl,
            fileName: newMsg.fileName,
            fileSize: newMsg.fileSize,
            fileType: newMsg.fileType,
            reactions: newMsg.reactions || {}
          };
          
          setMessages(prev => [...prev, parsed]);
          setShouldAutoScroll(true);
          setIsUserScrolling(false);
        });

        // Subscribe to typing indicators
        client.subscribe(`/topic/typing/${roomId}`, (msg) => {
          const { userId: typingUserId, isTyping: userIsTyping } = JSON.parse(msg.body);
          setTypingUsers(prev => {
            if (userIsTyping && !prev.includes(typingUserId)) {
              return [...prev, typingUserId];
            } else if (!userIsTyping) {
              return prev.filter(id => id !== typingUserId);
            }
            return prev;
          });
        });
      },
    });
    client.activate();
    stompClient.current = client;
    
    return () => {
      client.deactivate();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const payload: ChatMessageRequest = {
      chatRoomId: roomId,
      sessionId: roomId,
      userId,
      message: input.trim(),
      senderType: "USER",
      fileSize: 0 // Add this line
    };

    const fakeMessage: EnhancedChatMessage = {
      content: input,
      senderType: 'USER',
      senderName: 'Bạn',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      messageStatus: 'SENT',
      messageType: 'TEXT',
      isRead: false,
      response: '',
    };

    setMessages(prev => [...prev, fakeMessage]);
    setInput('');
    setShouldAutoScroll(true);
    setIsUserScrolling(false);
    
    // Stop typing indicator
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    await chatApi.sendMessage(payload);
  }, [input, roomId, userId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    handleTyping();
  }, [handleTyping]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // Memoize itemData
  const itemData = useMemo(() => messages, [messages]);

  // Render function cho react-window
  const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = itemData[index];
    return <MessageItem index={index} style={style} message={message} />;
  }, [itemData]);

  return (
    <div className={`chat-box ${isDark ? 'dark' : ''}`}>
      {/* Chat header */}
      <div className="chat-header">
        <h4>Chat Room</h4>
        <div className="header-actions">
          <button className="header-btn" title="Tìm kiếm">🔍</button>
          <button className="header-btn" title="Thông tin phòng">ℹ️</button>
          <button className="header-btn" title="Cài đặt">⚙️</button>
        </div>
      </div>

      {/* Messages container */}
      <div className="chat-messages-container">
        <List
          height={window.innerHeight - 280}
          itemCount={messages.length}
          itemSize={getItemHeightMemo}
          width={'100%'}
          ref={listRef}
          itemData={itemData}
          onScroll={handleScroll}
          overscanCount={5}
        >
          {renderItem}
        </List>
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
      </div>

      {/* Scroll to bottom button */}
      {isUserScrolling && (
        <button 
          className="scroll-to-bottom-btn"
          onClick={() => {
            setShouldAutoScroll(true);
            setIsUserScrolling(false);
            scrollToBottom();
          }}
        >
          ↓
        </button>
      )}

      {/* Emoji picker overlay */}
      {showEmojiPicker && (
        <div className="emoji-picker-overlay">
          <EmojiPicker 
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Chat input */}
      <div className="chat-input">
        <FileUpload onFileSelect={handleFileUpload} />
        
        <button 
          className="emoji-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Chọn emoji"
        >
          😊
        </button>
        
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          disabled={uploading}
        />
        
        <button 
          onClick={handleSend} 
          disabled={!input.trim() || uploading}
          className={uploading ? 'uploading' : ''}
        >
          {uploading ? '📤' : 'Gửi'}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;