import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { VariableSizeList as List } from 'react-window';
import { toast } from 'react-toastify';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { adminChatApi } from '../api/adminChatApi';
import { ChatMessageDTO, ChatMessageRequest } from '../../api/chatApi';

interface Props {
  roomId?: string;
  sessionId?: string;
}

interface EnhancedChatMessage extends ChatMessageDTO {
  reactions?: { [emoji: string]: string[] };
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
    <div className="typing-indicator-message" style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          U
        </div>
        <div style={{
          backgroundColor: '#f1f3f5',
          padding: '12px 16px',
          borderRadius: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>Đang nhập...</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: '#6c757d', borderRadius: '50%', animation: 'typing 1.4s infinite ease-in-out' }}></div>
            <div style={{ width: '4px', height: '4px', backgroundColor: '#6c757d', borderRadius: '50%', animation: 'typing 1.4s infinite ease-in-out 0.2s' }}></div>
            <div style={{ width: '4px', height: '4px', backgroundColor: '#6c757d', borderRadius: '50%', animation: 'typing 1.4s infinite ease-in-out 0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// File upload component
const FileUpload: React.FC<{ onFileSelect: (file: File) => void; disabled?: boolean }> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <>
      <button 
        className={`btn btn-outline-secondary btn-sm ${disabled ? 'disabled' : ''}`}
        onClick={handleClick} 
        title="Tải file lên"
        disabled={disabled}
      >
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
    <div style={{
      position: 'absolute',
      bottom: '60px',
      left: '10px',
      width: '300px',
      height: '200px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button
            key={cat}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              backgroundColor: activeCategory === cat ? '#e3f2fd' : 'transparent',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '4px',
        padding: '8px',
        height: '120px',
        overflowY: 'auto'
      }}>
        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map(emoji => (
          <button
            key={emoji}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
              borderRadius: '4px'
            }}
            onClick={() => onEmojiSelect(emoji)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {emoji}
          </button>
        ))}
      </div>
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '4px',
          right: '8px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ×
      </button>
    </div>
  );
};

// Enhanced message component for admin
const AdminMessageItem = React.memo(({ index, style, message }: { 
  index: number; 
  style: React.CSSProperties; 
  message: EnhancedChatMessage;
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  const isAdmin = message.senderType === 'ADMIN';
  const isUser = message.senderType === 'USER';

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
      <div style={{
        display: 'flex',
        flexDirection: isAdmin ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: '12px',
        width: '100%'
      }}>
        {/* Avatar */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: isAdmin ? '#28a745' : '#007bff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          flexShrink: 0,
          fontWeight: 'bold'
        }}>
          {isAdmin ? 'A' : 'U'}
        </div>
        
        {/* Message content */}
        <div style={{
          maxWidth: '65%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isAdmin ? 'flex-end' : 'flex-start'
        }}>
          <div 
            style={{
              backgroundColor: isAdmin ? '#28a745' : '#f1f3f5',
              color: isAdmin ? 'white' : '#333',
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
              <div style={{ marginBottom: message.content ? '8px' : '0' }}>
                {isImage(message.fileType) ? (
                  <img 
                    src={message.fileUrl} 
                    alt={message.fileName}
                    style={{ maxWidth: '200px', borderRadius: '8px', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '20px' }}>📄</div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{message.fileName}</div>
                      <div style={{ fontSize: '10px', opacity: 0.8 }}>
                        {message.fileSize && formatFileSize(message.fileSize)}
                      </div>
                    </div>
                    <button style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}>
                      ⬇️
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Text content */}
            {message.content && (
              <div>
                {message.content}
                {message.isEdited && <span style={{ fontSize: '10px', opacity: 0.7 }}> (đã chỉnh sửa)</span>}
              </div>
            )}

            {/* Message status for admin messages */}
            {isAdmin && (
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '6px',
                fontSize: '10px',
                opacity: 0.7
              }}>
                {message.messageStatus === 'SENT' && '✓'}
                {message.messageStatus === 'RECEIVED' && '✓✓'}
                {message.messageStatus === 'READ' && <span style={{ color: '#4CAF50' }}>✓✓</span>}
              </div>
            )}

            {/* Reaction button */}
            {showReactions && (
              <button 
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: isAdmin ? 'auto' : '10px',
                  left: isAdmin ? '10px' : 'auto',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😊
              </button>
            )}
          </div>

          {/* Reactions display */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div style={{
              display: 'flex',
              gap: '4px',
              marginTop: '4px',
              flexWrap: 'wrap'
            }}>
              {Object.entries(message.reactions).map(([emoji, userIds]) => (
                <span key={emoji} style={{
                  backgroundColor: '#f1f3f5',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  {emoji} {userIds.length}
                </span>
              ))}
            </div>
          )}
          
          <div style={{
            fontSize: '11px',
            color: '#6c757d',
            marginTop: '6px',
            padding: '0 8px'
          }}>
            {new Date(message.createdAt).toLocaleString('vi-VN')}
          </div>
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div style={{ position: 'relative' }}>
            <EmojiPicker 
              onEmojiSelect={() => setShowEmojiPicker(false)}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
});

const AdminChatSupportDetails: React.FC<Props> = ({ roomId: propRoomId }) => {
  const { roomId: paramRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation(); 
  const roomId = propRoomId || paramRoomId;
  const sessionId = location.state?.sessionId;

  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  
  const listRef = useRef<any>(null);
  const stompClient = useRef<Client | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const adminId = Number(sessionStorage.getItem('userId'));
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemHeights = useRef<{ [key: number]: number }>({});

  // Dynamic height calculation
  const getItemHeight = (message: EnhancedChatMessage, width: number = 300): number => {
    const contentLength = message.content?.length || 0;
    let baseHeight = 80;
    
    if (message.fileUrl) {
      if (message.fileType?.startsWith('image/')) {
        baseHeight += 150;
      } else {
        baseHeight += 60;
      }
    }
    
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

  // Load initial data
  useEffect(() => {
    if (!roomId || !sessionId) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load messages
        const messagesRes = await adminChatApi.getMessagesByChatRoom(roomId, 0, 50);
        console.log('Loaded messages:', messagesRes.data);
        
        if (messagesRes.data && messagesRes.data.content) {
          const enhancedMessages: EnhancedChatMessage[] = messagesRes.data.content.map((msg: any) => ({
            content: msg.content || msg.message,
            senderType: msg.senderType,
            senderName: msg.senderName || (msg.senderType === 'ADMIN' ? 'Admin' : 'Khách hàng'),
            createdAt: msg.createdAt || msg.timestamp,
            timestamp: msg.timestamp || msg.createdAt,
            messageStatus: msg.messageStatus || 'RECEIVED',
            messageType: msg.messageType || 'TEXT',
            isRead: true,
            response: msg.response || '',
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            fileType: msg.fileType,
            reactions: msg.reactions || {}
          }));
          setMessages(enhancedMessages.reverse());
        }

        // Join room as admin
        await adminChatApi.joinRoom(roomId);
        toast.success('Đã tham gia phòng chat thành công');
        
      } catch (error: any) {
        console.error('Error loading chat data:', error);
        toast.error('Không thể tải dữ liệu chat');
        navigate('/admin/chat-support');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [roomId, sessionId, navigate]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      if (stompClient.current?.connected) {
        stompClient.current.publish({
          destination: `/app/typing/${sessionId}`,
          body: JSON.stringify({ userId: adminId, isTyping: true })
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
          destination: `/app/typing/${sessionId}`,
          body: JSON.stringify({ userId: adminId, isTyping: false })
        });
      }
    }, 3000);
  }, [isTyping, sessionId, adminId]);

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId!);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const { fileUrl } = await uploadResponse.json();
      
      const payload: ChatMessageRequest = {
        chatRoomId: roomId!,
        sessionId: sessionId!,
        userId: adminId,
        message: file.name,
        senderType: 'ADMIN',
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };

      await adminChatApi.sendMessage(payload);
      toast.success('Đã gửi file thành công');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Không thể tải file lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  // WebSocket setup
  useEffect(() => {
    if (!roomId) return;

    const socket = new SockJS('http://localhost:8083/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Admin connected to WebSocket, subscribing to room:', sessionId);
        
        // Subscribe to room messages
        client.subscribe(`/topic/room/${sessionId}`, (msg) => {
          console.log("roomId:", sessionId, "Message received:", msg);
          const newMsg = JSON.parse(msg.body);
          const parsed: EnhancedChatMessage = {
            content: newMsg.response || newMsg.content || newMsg.message,
            senderType: newMsg.senderType,
            senderName: newMsg.senderName || (newMsg.senderType === 'ADMIN' ? 'Admin' : 'Khách hàng'),
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
        client.subscribe(`/topic/room/${sessionId}`, (msg) => {
            console.log("roomId:", sessionId, "Typing message received:", msg);
          const { userId: typingUserId, isTyping: userIsTyping } = JSON.parse(msg.body);
          if (typingUserId !== adminId) { // Don't show own typing
            setTypingUsers(prev => {
              if (userIsTyping && !prev.includes(typingUserId)) {
                return [...prev, typingUserId];
              } else if (!userIsTyping) {
                return prev.filter(id => id !== typingUserId);
              }
              return prev;
            });
          }
        });
      },
      onDisconnect: () => {
        console.log('Admin disconnected from WebSocket');
      }
    });
    
    client.activate();
    stompClient.current = client;
    
    return () => {
      client.deactivate();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, adminId]);

  // Auto scroll effect
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

  const handleSend = useCallback(async () => {
    if (!input.trim() || !sessionId || !roomId) return;

    const payload: ChatMessageRequest = {
      chatRoomId: roomId,
      sessionId: sessionId,
      userId: adminId,
      message: input.trim(),
      senderType: "ADMIN",
      fileSize: 0
    };

    const fakeMessage: EnhancedChatMessage = {
      content: input,
      senderType: 'ADMIN',
      senderName: 'Admin',
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
    
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    try {
      await adminChatApi.sendMessage(payload);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Không thể gửi tin nhắn');
    }
  }, [input, roomId, sessionId, adminId]);

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

  const handleResolveRoom = async () => {
    if (!roomId) return;
    
    try {
      await adminChatApi.resolveRoom(roomId);
      setIsResolved(true);
      toast.success('Đã đánh dấu phòng chat là đã xử lý');
    } catch (error) {
      console.error('Error resolving room:', error);
      toast.error('Không thể đánh dấu phòng chat');
    }
  };

  const handleBackToList = () => {
    navigate('/admin/chat-support');
  };

  const itemData = useMemo(() => messages, [messages]);

  const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = itemData[index];
    return <AdminMessageItem index={index} style={style} message={message} />;
  }, [itemData]);

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Lỗi</h4>
          <p>Không tìm thấy ID phòng chat.</p>
          <button className="btn btn-primary" onClick={handleBackToList}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-outline-secondary me-3"
            onClick={handleBackToList}
            title="Quay lại danh sách"
          >
            <i className="bi bi-arrow-left"></i> Quay lại
          </button>
          <h3 className="h3 mb-0 text-gray-800">
            Chat Support - Room {roomId}
          </h3>
        </div>
        <div className="d-flex gap-2">
          <button 
            className={`btn btn-sm ${isResolved ? 'btn-secondary' : 'btn-success'}`}
            onClick={handleResolveRoom}
            disabled={isResolved}
            title={isResolved ? 'Đã xử lý' : 'Đánh dấu đã xử lý'}
          >
            <i className={`bi ${isResolved ? 'bi-check-circle-fill' : 'bi-check-circle'} me-1`}></i>
            {isResolved ? 'Đã xử lý' : 'Đánh dấu xử lý'}
          </button>
          <button 
            className="btn btn-outline-info btn-sm"
            title="Thông tin phòng"
          >
            <i className="bi bi-info-circle"></i>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="card shadow">
        <div className="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">
            Cuộc trò chuyện
          </h6>
          <div className="d-flex align-items-center gap-2">
            {isResolved && (
              <span className="badge bg-success">Đã xử lý</span>
            )}
            <span className="badge bg-info">
              {messages.length} tin nhắn
            </span>
          </div>
        </div>

        <div className="card-body p-0" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
          {/* Messages Area */}
          <div style={{ 
            flex: 1, 
            position: 'relative',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6'
          }}>
            {messages.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="text-center text-muted">
                  <i className="bi bi-chat-dots" style={{ fontSize: '48px' }}></i>
                  <p className="mt-3">Chưa có tin nhắn nào trong cuộc trò chuyện này</p>
                </div>
              </div>
            ) : (
              <List
                height={window.innerHeight - 350}
                itemCount={messages.length}
                itemSize={getItemHeightMemo}
                width={'100%'}
                ref={listRef}
                itemData={itemData}
                onScroll={handleScroll}
                overscanCount={5}
                style={{ backgroundColor: '#f8f9fa' }}
              >
                {renderItem}
              </List>
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div style={{ 
                position: 'absolute', 
                bottom: '10px', 
                left: '16px', 
                right: '16px' 
              }}>
                <TypingIndicator users={typingUsers} />
              </div>
            )}

            {/* Scroll to bottom button */}
            {isUserScrolling && (
              <button 
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#007bff',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  fontSize: '18px',
                  zIndex: 100
                }}
                onClick={() => {
                  setShouldAutoScroll(true);
                  setIsUserScrolling(false);
                  scrollToBottom();
                }}
                title="Cuộn xuống cuối"
              >
                ↓
              </button>
            )}
          </div>

          {/* Input Area */}
          <div style={{ 
            padding: '16px',
            backgroundColor: 'white',
            borderTop: '1px solid #dee2e6',
            position: 'relative'
          }}>
            {/* Quick responses */}
            <div className="mb-2">
              <div className="d-flex gap-2 flex-wrap">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setInput('Xin chào! Tôi có thể giúp gì cho bạn?')}
                  disabled={isResolved}
                >
                  Chào hỏi
                </button>
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setInput('Cảm ơn bạn đã liên hệ. Vấn đề của bạn đã được xử lý.')}
                  disabled={isResolved}
                >
                  Kết thúc
                </button>
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setInput('Vui lòng chờ trong giây lát, tôi sẽ kiểm tra thông tin cho bạn.')}
                  disabled={isResolved}
                >
                  Chờ kiểm tra
                </button>
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setInput('Bạn có thể cung cấp thêm thông tin chi tiết không?')}
                  disabled={isResolved}
                >
                  Yêu cầu thông tin
                </button>
              </div>
            </div>

            {/* Input row */}
            <div className="d-flex align-items-center gap-2">
              <FileUpload 
                onFileSelect={handleFileUpload} 
                disabled={uploading || isResolved}
              />
              
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Chọn emoji"
                disabled={isResolved}
              >
                😊
              </button>
              
              <div className="flex-grow-1">
                <input
                  type="text"
                  className="form-control"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isResolved ? "Cuộc trò chuyện đã kết thúc" : "Nhập phản hồi cho khách hàng..."}
                  disabled={uploading || isResolved}
                  style={{ minHeight: '40px' }}
                />
              </div>
              
              <button 
                className={`btn btn-primary ${uploading ? 'disabled' : ''}`}
                onClick={handleSend} 
                disabled={!input.trim() || uploading || isResolved}
                title="Gửi tin nhắn"
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Đang tải...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-1"></i>
                    Gửi
                  </>
                )}
              </button>
            </div>

            {/* Character count */}
            {input.length > 0 && (
              <div className="text-end mt-1">
                <small className={`text-${input.length > 500 ? 'danger' : 'muted'}`}>
                  {input.length}/1000
                </small>
              </div>
            )}

            {/* Emoji picker */}
            {showEmojiPicker && (
              <EmojiPicker 
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Room Info Panel (Optional) */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">Thông tin phòng chat</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <strong>Room ID:</strong>
                  <p className="text-muted">{roomId}</p>
                </div>
                <div className="col-6">
                  <strong>Trạng thái:</strong>
                  <p>
                    <span className={`badge ${isResolved ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {isResolved ? 'Đã xử lý' : 'Đang xử lý'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-6">
                  <strong>Tổng tin nhắn:</strong>
                  <p className="text-muted">{messages.length}</p>
                </div>
                <div className="col-6">
                  <strong>Admin phụ trách:</strong>
                  <p className="text-muted">Bạn (ID: {adminId})</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">Thống kê cuộc trò chuyện</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <strong>Tin nhắn từ khách:</strong>
                  <p className="text-muted">
                    {messages.filter(m => m.senderType === 'USER').length}
                  </p>
                </div>
                <div className="col-6">
                  <strong>Tin nhắn từ Admin:</strong>
                  <p className="text-muted">
                    {messages.filter(m => m.senderType === 'ADMIN').length}
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-6">
                  <strong>Thời gian bắt đầu:</strong>
                  <p className="text-muted">
                    {messages.length > 0 ? 
                      new Date(messages[0].createdAt).toLocaleString('vi-VN') : 
                      'N/A'
                    }
                  </p>
                </div>
                <div className="col-6">
                  <strong>Cập nhật cuối:</strong>
                  <p className="text-muted">
                    {messages.length > 0 ? 
                      new Date(messages[messages.length - 1].createdAt).toLocaleString('vi-VN') : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          30% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .chat-message {
          transition: all 0.2s ease;
        }

        .chat-message:hover {
          background-color: rgba(0,0,0,0.02);
        }

        .message-wrapper:hover .reaction-btn {
          opacity: 1;
        }

        .reaction-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .emoji-picker-overlay {
          position: absolute;
          z-index: 1000;
        }

        .btn:disabled {
          cursor: not-allowed;
        }

        .card {
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .chat-messages-container {
          overflow: hidden;
        }

        .quick-response-btn {
          transition: all 0.2s ease;
        }

        .quick-response-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default AdminChatSupportDetails;