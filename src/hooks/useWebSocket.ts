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

interface ChatMsg {
  senderId: number;
  receiverId: number;
  message: string;
  type: 1 | 2; // 1为私聊，2为群聊
}

interface MessageVo {
  id: number;
  sender: number;
  receiver: number;
  content: string;
  gmtCreate: string;
}

interface WebSocketMessage {
  action: 1 | 2 | 3 | 4; // 1连接，2聊天，3用户状态更新，4通知
  chatMsg?: ChatMsg;
  userName?: string; // 发送者用户名
  avatar?: string; // 发送者头像
  message?: MessageVo; // 新的消息对象结构
  data?: any; // 保留用于其他类型的数据
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
        console.log('收到消息:', data);
        switch (data.action) {
          case 2: // 聊天消息
            // 处理新的MessageVo数据结构
            if (data.message) {
              const newMessage: Message = {
                id: data.message.id,
                sender: data.userName || data.message.sender.toString(),
                content: data.message.content,
                timestamp: data.message.gmtCreate
              };
              setMessages(prev => [...prev, newMessage]);
            }
            // 兼容原有的chatMsg结构
            else if (data.chatMsg) {
              const newMessage: Message = {
                id: Date.now(), // 临时ID，实际应该从服务器获取
                sender: data.chatMsg.senderId.toString(),
                content: data.chatMsg.message,
                timestamp: new Date().toISOString()
              };
              setMessages(prev => [...prev, newMessage]);
            }
            break;
          case 3: // 用户状态更新
            if (data.data) {
              setContacts(data.data);
            }
            break;
          case 4: // 通知
            if (data.data) {
              message.info(data.data.content || data.data.message);
            }
            break;
          case 1: // 连接确认
            console.log('连接已确认');
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

  const sendMessage = useCallback((content: string, receiverId: number, type: 1 | 2 = 1) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      message.error('未连接到聊天服务器');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      message.error('用户未登录');
      return;
    }

    const messageData: WebSocketMessage = {
      action: 2, // 聊天消息
      chatMsg: {
        senderId: parseInt(userId),
        receiverId,
        message: content,
        type // 1为私聊，2为群聊
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