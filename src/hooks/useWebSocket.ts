import { useEffect, useRef, useState, useCallback } from 'react';
import { message } from 'antd';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
}

interface Contact {
  id: number;
  name: string;
  lastMessage: string;
  unread: number;
  online?: boolean;
  type: 'personal' | 'group';
  phone?: string;
  members?: { id: string; name: string }[];
}

interface WebSocketMessage {
  type: 'message' | 'contact_update' | 'notification';
  data: any;
}

const WS_URL = 'ws://localhost:9000/ws';

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      message.error('未登录');
      //重新登录，定向到登录页面
      
    }

    const socket = new WebSocket(`${WS_URL}`);

    socket.onopen = () => {
      //fetch发送注册登陆消息，上线
      const userId=localStorage.getItem('userId');
      const data={
        action:1,
        chatMsg:{
          senderId: userId,
        }
      }
      socket.send(JSON.stringify(data));
      setIsConnected(true);
      message.success('已连接到聊天服务器');
    };
    //接收到消息
    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        switch (data.type) {
          case 'message':
            setMessages(prev => [...prev, data.data]);
            break;
          case 'contact_update':
            setContacts(data.data);
            break;
          case 'notification':
            message.info(data.data.content);
            break;
        }
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      message.warning('与聊天服务器断开连接');
      // 尝试重新连接
      setTimeout(connect, 3000);
      //下线,删除localStorage
      //向后端发送logout请求
    };

    socket.onerror = (error) => {
      console.error('WebSocket错误:', error);
      message.error('连接发生错误');
    };

    ws.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((content: string, receiverId: number) => {
    if (!ws.current || !isConnected) {
      message.error('未连接到聊天服务器');
      return;
    }

    const messageData = {
      type: 'message',
      data: {
        receiverId,
        content,
        timestamp: new Date().toISOString()
      }
    };

    ws.current.send(JSON.stringify(messageData));
  }, [isConnected]);

  // 初始化WebSocket连接
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // 获取历史消息
  const fetchHistoryMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/chat/messages/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.code === 200) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('获取历史消息失败:', error);
      message.error('获取历史消息失败');
    }
  }, []);

  // 获取联系人列表
  const fetchContacts = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/chat/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.code === 200) {
        setContacts(data.data);
      }
    } catch (error) {
      console.error('获取联系人列表失败:', error);
      message.error('获取联系人列表失败');
    }
  }, []);

  return {
    isConnected,
    messages,
    contacts,
    sendMessage,
    fetchHistoryMessages,
    fetchContacts
  };
};