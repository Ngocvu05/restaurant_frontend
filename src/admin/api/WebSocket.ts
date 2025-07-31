import { Client, IMessage, CompatClient, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Types
interface WebSocketCallbacks {
  // User service callbacks (port 8081)
  onUserNotificationReceived?: (notification: any) => void;
  
  // Chat service callbacks (port 8083)
  onChatNotificationReceived?: (notification: any) => void;
  onAdminAlertReceived?: (alertMessage: string) => void;
  onAdminBroadcastReceived?: (broadcastMessage: string) => void;
}

interface ConnectionState {
  userService: {
    client: CompatClient | null;
    connected: boolean;
  };
  chatService: {
    client: Client | null;
    connected: boolean;
  };
}

// Connection state management
let connections: ConnectionState = {
  userService: {
    client: null,
    connected: false
  },
  chatService: {
    client: null,
    connected: false
  }
};

/**
 * Connect to User Service WebSocket (port 8081) - for user notifications
 */
export const connectUserServiceWebSocket = (username: string, onMessage: (msg: any) => void) => {
  if (connections.userService.connected) {
    console.log('🔗 User Service WebSocket đã được kết nối');
    return;
  }

  const token = sessionStorage.getItem('token');
  console.log("🔐 User Service WebSocket connect as:", username, "Token:", token);

  const socket = new SockJS(`http://localhost:8081/ws?token=${token}`);
  const stompClient: CompatClient = Stomp.over(socket);

  stompClient.connect(
    { Authorization: `Bearer ${token}` },
    () => {
      console.log('✅ User Service STOMP Connected');
      connections.userService.connected = true;
      
      // Subscribe to the private user queue
      stompClient.subscribe('/user/queue/private', (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log('📩 User Service message received:', data);
          onMessage(data);
        } catch (e) {
          console.error("❌ Failed to parse user service message", message.body, e);
        }
      });
    },
    (error: any) => {
      console.error('❌ User Service STOMP connection failed:', error);
      connections.userService.connected = false;
    }
  );

  connections.userService.client = stompClient;
};

/**
 * Connect to Chat Service WebSocket (port 8083) - for chat notifications and admin alerts
 */
export const connectChatServiceWebSocket = (username: string, callbacks: Omit<WebSocketCallbacks, 'onUserNotificationReceived'> = {}) => {
  if (connections.chatService.connected) {
    console.log('🔗 Chat Service WebSocket đã được kết nối');
    return;
  }

  const {
    onChatNotificationReceived,
    onAdminAlertReceived,
    onAdminBroadcastReceived
  } = callbacks;

  // Tạo SockJS connection
  const socket = new SockJS('http://localhost:8083/ws');
  const stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  stompClient.onConnect = (frame) => {
    console.log('🟢 Chat Service Connected to WebSocket:', frame);
    connections.chatService.connected = true;

    // Subscribe cho thông báo chung (notifications từ chat service)
    if (onChatNotificationReceived && stompClient) {
      stompClient.subscribe('/topic/notifications', (message: IMessage) => {
        try {
          const notification = JSON.parse(message.body);
          console.log('🔔 Chat Service notification received:', notification);
          onChatNotificationReceived(notification);
        } catch (error) {
          console.error('❌ Error parsing chat notification:', error);
        }
      });
    }

    // Subscribe cho thông báo riêng tư của admin (alerts)
    const adminId = sessionStorage.getItem('adminId') || sessionStorage.getItem('userId');
    if (adminId && onAdminAlertReceived && stompClient) {
      stompClient.subscribe(`/user/queue/alerts`, (message: IMessage) => {
        try {
          const alertMessage = message.body;
          console.log('🚨 Admin alert received:', alertMessage);
          onAdminAlertReceived(alertMessage);
        } catch (error) {
          console.error('❌ Error processing admin alert:', error);
        }
      });
    }

    // Subscribe cho thông báo admin broadcast
    if (onAdminBroadcastReceived && stompClient) {
      stompClient.subscribe('/topic/admin/notify', (message: IMessage) => {
        try {
          const broadcastMessage = message.body;
          console.log('📢 Admin broadcast received:', broadcastMessage);
          onAdminBroadcastReceived(broadcastMessage);
        } catch (error) {
          console.error('❌ Error processing admin broadcast:', error);
        }
      });
    }
  };

  stompClient.onStompError = (frame) => {
    console.error('🔴 Chat Service STOMP error:', frame.headers['message']);
    console.error('🔴 Details:', frame.body);
    connections.chatService.connected = false;
  };

  stompClient.onWebSocketClose = () => {
    console.log('🔴 Chat Service WebSocket connection closed');
    connections.chatService.connected = false;
  };

  stompClient.onWebSocketError = (error) => {
    console.error('🔴 Chat Service WebSocket error:', error);
    connections.chatService.connected = false;
  };

  connections.chatService.client = stompClient;
  // Activate the client
  stompClient.activate();
};

/**
 * Connect to both services at once
 */
export const connectAllWebSockets = (username: string, callbacks: WebSocketCallbacks = {}) => {
  const {
    onUserNotificationReceived,
    onChatNotificationReceived,
    onAdminAlertReceived,
    onAdminBroadcastReceived
  } = callbacks;

  // Connect to User Service
  if (onUserNotificationReceived) {
    connectUserServiceWebSocket(username, onUserNotificationReceived);
  }

  // Connect to Chat Service
  connectChatServiceWebSocket(username, {
    onChatNotificationReceived,
    onAdminAlertReceived,
    onAdminBroadcastReceived
  });
};

/**
 * Disconnect from User Service
 */
export const disconnectUserServiceWebSocket = () => {
  if (connections.userService.client && connections.userService.connected) {
    connections.userService.client.disconnect();
    connections.userService.client = null;
    connections.userService.connected = false;
    console.log('🔴 User Service WebSocket disconnected');
  }
};

/**
 * Disconnect from Chat Service
 */
export const disconnectChatServiceWebSocket = () => {
  if (connections.chatService.client && connections.chatService.connected) {
    connections.chatService.client.deactivate();
    connections.chatService.client = null;
    connections.chatService.connected = false;
    console.log('🔴 Chat Service WebSocket disconnected');
  }
};

/**
 * Disconnect from all services
 */
export const disconnectAllWebSockets = () => {
  disconnectUserServiceWebSocket();
  disconnectChatServiceWebSocket();
  console.log('🔴 All WebSocket connections disconnected');
};

/**
 * Send message to Chat Service
 */
export const sendChatMessage = (destination: string, message: any) => {
  if (connections.chatService.client && connections.chatService.connected) {
    connections.chatService.client.publish({
      destination: destination,
      body: JSON.stringify(message)
    });
  } else {
    console.error('❌ Chat Service WebSocket not connected. Cannot send message.');
  }
};

/**
 * Check connection status
 */
export const getConnectionStatus = () => {
  return {
    userService: connections.userService.connected,
    chatService: connections.chatService.connected,
    allConnected: connections.userService.connected && connections.chatService.connected
  };
};

/**
 * Legacy function names for backward compatibility
 */
export const connectWebSocket = connectUserServiceWebSocket;
export const disconnectWebSocket = disconnectAllWebSockets;
export const isWebSocketConnected = () => getConnectionStatus().allConnected;