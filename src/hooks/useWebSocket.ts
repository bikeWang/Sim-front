import { useEffect, useRef, useState, useCallback } from 'react';
import { App } from 'antd';

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

const WS_URL = 'ws://localhost:8080/ws';
const RECONNECT_DELAY = 3000;

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const connectionAttempt = useRef<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { message } = App.useApp();

  const connect = useCallback(() => {
    if (connectionAttempt.current) {
      return; // 防止重复连接尝试
    }

    if (ws.current?.readyState === WebSocket.CONNECTING || 
        ws.current?.readyState === WebSocket.OPEN) {
      return; // 已经在连接中或已连接
    }

    connectionAttempt.current = true;
    const userId = localStorage.getItem('userId');
    const socket = new WebSocket(WS_URL);

    const handleOpen = () => {
      connectionAttempt.current = false;
      setIsConnected(true);
      // 发送上线消息
      socket.send(JSON.stringify({
        action: 1,
        chatMsg: {
          senderId: userId
        }
      }));
      // 清除重连定时器
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = undefined;
      }
    };

    const handleMessage = (event: MessageEvent) => {
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

    const handleClose = () => {
      connectionAttempt.current = false;
      setIsConnected(false);
      ws.current = null;

      // 设置重连定时器
      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          reconnectTimeout.current = undefined;
          connect();
        }, RECONNECT_DELAY);
      }
    };

    const handleError = (error: Event) => {
      connectionAttempt.current = false;
      console.error('WebSocket错误:', error);
      message.error('连接发生错误');
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('message', handleMessage);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('error', handleError);

    ws.current = socket;

    return () => {
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('error', handleError);
    };
  }, [message]);

  const disconnect = useCallback(() => {
    connectionAttempt.current = false;

    // 清除重连定时器
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
    ws.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((content: string, receiverId: number) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
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
  }, [message]);

  // 初始化WebSocket连接
  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      disconnect();
    };
  }, [connect, disconnect]);

  // 获取历史消息
  const fetchHistoryMessages = useCallback(async () => {
    try {
      const response = await fetch('/chat/messages/history');
      const data = await response.json();
      if (data.code === 200) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('获取历史消息失败:', error);
      message.error('获取历史消息失败');
    }
  }, [message]);

  // 获取联系人列表
  const fetchContacts = useCallback(async () => {
    try {
      const userId=localStorage.getItem('userId');
      const accessToken = localStorage.getItem('accessToken');
      const url=`/api/chat/getAllChatBox?userId=${userId}`;
      const response = await fetch(url,
        {
         method: 'GET', // 根据接口要求设置请求方法，GET/POST等
         headers: {
            'Content-Type': 'application/json', // 通常需要指定内容类型
            'Authorization': accessToken ? `Bearer ${accessToken}` : '' // 拼接 Bearer 前缀
         }
        }
      );
      const data = await response.json();
      if (data.code === 200) {
        // 转换新的数据结构为应用所需的联系人格式
        const formattedContacts = data.data.map((item: any) => {
          if (item.type) { // 群组类型
            return {
              id: item.group.groupId,
              name: item.group.groupName,
              lastMessage: '',
              unread: 0,
              type: 'group',
              members: [] // 可以在需要时获取群组成员
            };
          } else { // 个人联系人类型
            return {
              id: item.userVo.user.userId,
              name: item.userVo.user.userName,
              lastMessage: '',
              unread: 0,
              online: item.userVo.status,
              type: 'personal',
              phone: '' // 可以在需要时添加电话信息
            };
          }
        });
        setContacts(formattedContacts);
      }
    } catch (error) {
      console.error('获取联系人列表失败:', error);
      message.error('获取联系人列表失败');
    }
  }, [message]);


  return {
    isConnected,
    messages,
    contacts,
    sendMessage,
    fetchHistoryMessages,
    fetchContacts
  };
};