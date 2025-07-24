import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { App } from 'antd';

interface Message {
  id: number;
  sender: string;
  receiver?: string;
  content: string;
  timestamp: string;
  type?: 1 | 2; // 1为私聊，2为群聊
  userName?: string; // 发送者用户名
  avatar?: string; // 发送者头像
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
  action: number;
  avatar: string;
  content: string;
  gmtCreate: string;
  id: number;
  receiver: number;
  sender: number;
  userName: string;
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
  // 初始化联系人消息状态
  const [contactMessages, setContactMessages] = useState<Map<string, Message[]>>(() => {
    const saved = localStorage.getItem('contactMessages');
    if (saved) {
      try {
        const messagesObj = JSON.parse(saved);
        return new Map(Object.entries(messagesObj));
      } catch (error) {
        console.error('解析保存的消息失败:', error);
        return new Map();
      }
    }
    return new Map();
  });
  
  // 当前选中的联系人ID
  const [currentContactId, setCurrentContactId] = useState<string>('');
  
  // 当前选中联系人的消息（计算属性）
  const messages = useMemo(() => {
    return currentContactId ? (contactMessages.get(currentContactId) || []) : [];
  }, [contactMessages, currentContactId]);
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
        const data = JSON.parse(event.data);
        console.log('收到消息:', data);
        
        // 检查是否是MessageVo格式的消息（直接接收）
        if (data.action && data.content && data.userName && data.gmtCreate) {
          const messageVo: MessageVo = data;
          const newMessage: Message = {
            id: messageVo.id,
            sender: messageVo.sender?.toString(),
            receiver: messageVo.receiver?.toString(),
            content: messageVo.content,
            timestamp: messageVo.gmtCreate,
            type: 1, // 默认为私聊
            userName: messageVo.userName,
            avatar: messageVo.avatar
          };
          console.log('接收到新消息(MessageVo):', {
             原始数据: messageVo,
             解析后消息: newMessage,
             当前用户ID: localStorage.getItem('userId'),
             当前用户名: localStorage.getItem('userName')
           });
           
           // 确定消息所属的联系人ID
           const currentUserId = localStorage.getItem('userId');
           const contactId = newMessage.sender === currentUserId ? newMessage.receiver : newMessage.sender;
           
           if (contactId) {
             setContactMessages(prev => {
               const newMap = new Map(prev);
               const existingMessages = newMap.get(contactId) || [];
               newMap.set(contactId, [...existingMessages, newMessage]);
               return newMap;
             });
           }
          return;
        }
        
        // 兼容WebSocketMessage格式（用于其他类型的消息）
        const wsMessage: WebSocketMessage = data;
        switch (wsMessage.action) {
          case 2: // 聊天消息
            if (wsMessage.chatMsg) {
              const newMessage: Message = {
                id: Date.now(), // 临时ID，实际应该从服务器获取
                sender: wsMessage.chatMsg.senderId.toString(),
                receiver: wsMessage.chatMsg.receiverId.toString(),
                content: wsMessage.chatMsg.message,
                timestamp: new Date().toISOString(),
                type: wsMessage.chatMsg.type
              };
              console.log('接收到新消息(chatMsg):', {
                 原始数据: wsMessage,
                 解析后消息: newMessage,
                 当前用户ID: localStorage.getItem('userId'),
                 当前用户名: localStorage.getItem('userName')
               });
               
               // 确定消息所属的联系人ID
               const currentUserId = localStorage.getItem('userId');
               const contactId = newMessage.sender === currentUserId ? newMessage.receiver : newMessage.sender;
               
               if (contactId) {
                 setContactMessages(prev => {
                   const newMap = new Map(prev);
                   const existingMessages = newMap.get(contactId) || [];
                   newMap.set(contactId, [...existingMessages, newMessage]);
                   return newMap;
                 });
               }
            }
            break;
          case 3: // 用户状态更新
            if (wsMessage.data) {
              setContacts(wsMessage.data);
            }
            break;
          case 4: // 通知
            if (wsMessage.data) {
              message.info(wsMessage.data.content || wsMessage.data.message);
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

  // 用户下线功能
  const logout = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const accessToken = localStorage.getItem('accessToken');
      
      if (!userId || !accessToken) {
        message.error('用户信息不完整');
        return false;
      }

      // 调用后端下线API
      const response = await fetch('/api/user-info/user/offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (data.code === 200) {
        // 下线成功，断开WebSocket连接
        disconnect();
        
        // 清除本地存储
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('contactMessages');
        localStorage.removeItem('refreshToken');
        
        // 重置状态
        setContactMessages(new Map());
        setCurrentContactId('');
        setContacts([]);
        
        message.success('退出成功');
        return true;
      } else {
        message.error(data.message || '退出失败');
        return false;
      }
    } catch (error) {
      console.error('退出登录失败:', error);
      message.error('退出登录失败');
      return false;
    }
  }, [disconnect, message]);

  const sendMessage = useCallback((content: string, receiverId: number, type: 1 | 2 = 1) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      message.error('未连接到聊天服务器');
      return;
    }

    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    if (!userId) {
      message.error('用户未登录');
      return;
    }

    // 立即添加消息到本地状态（发送者视角）
    const newMessage: Message = {
      id: Date.now(), // 临时ID，后续可以用服务器返回的真实ID替换
      sender: userName || userId,
      receiver: receiverId.toString(),
      content,
      timestamp: new Date().toISOString(),
      type
    };
    
    // 添加到对应联系人的消息列表
    const contactId = receiverId.toString();
    setContactMessages(prev => {
      const newMap = new Map(prev);
      const existingMessages = newMap.get(contactId) || [];
      newMap.set(contactId, [...existingMessages, newMessage]);
      return newMap;
    });

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

  // 监听contactMessages变化，自动保存到localStorage
  useEffect(() => {
    console.log('消息状态更新:', {
      contactCount: contactMessages.size,
      currentContactId,
      currentMessageCount: messages.length,
      latestMessages: messages.slice(-3) // 显示最新的3条消息
    });
    
    // 将Map转换为普通对象进行存储
    const messagesObj = Object.fromEntries(contactMessages);
    localStorage.setItem('contactMessages', JSON.stringify(messagesObj));
  }, [contactMessages, currentContactId, messages]);

  // 初始化WebSocket连接
  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      disconnect();
    };
  }, [connect, disconnect]);

  // 获取指定联系人的历史消息
  const fetchHistoryMessages = useCallback(async (contactId: string) => {
    try {
      // 检查是否已经加载过该联系人的消息
      if (contactMessages.has(contactId)) {
        console.log(`联系人 ${contactId} 的消息已存在，跳过加载`);
        return;
      }
      
      const userId = localStorage.getItem('userId');
      const accessToken = localStorage.getItem('accessToken');
      const url = `/api/chat/getChatById?userId=${userId}&friendId=${contactId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      });
      
      const data = await response.json();
      if (data.code === 200) {
        // 转换服务器返回的消息格式
        const historyMessages: Message[] = data.data.map((item: any) => ({
          id: item.id,
          sender: item.sender?.toString(),
          receiver: item.receiver?.toString(),
          content: item.content,
          timestamp: item.gmtCreate,
          type: 1, // 默认为私聊
          userName: item.userName,
          avatar: item.avatar
        }));
        
        // 存储到对应联系人的消息列表
        setContactMessages(prev => {
          const newMap = new Map(prev);
          newMap.set(contactId, historyMessages);
          return newMap;
        });
        
        console.log(`成功加载联系人 ${contactId} 的 ${historyMessages.length} 条历史消息`);
      }
    } catch (error) {
      console.error('获取历史消息失败:', error);
      message.error('获取历史消息失败');
    }
  }, [contactMessages, message]);
  
  // 设置当前选中的联系人并加载其历史消息
  const setSelectedContact = useCallback(async (contactId: string) => {
    setCurrentContactId(contactId);
    await fetchHistoryMessages(contactId);
  }, [fetchHistoryMessages]);

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
    messages, // 当前选中联系人的消息
    contactMessages, // 所有联系人的消息Map
    currentContactId, // 当前选中的联系人ID
    sendMessage,
    fetchHistoryMessages,
    setSelectedContact, // 设置选中联系人并加载历史消息
    fetchContacts,
    contacts,
    logout // 用户下线功能
  };
};