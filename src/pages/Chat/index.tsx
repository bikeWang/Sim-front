import React, { useState, useEffect, useRef } from 'react';
import { Layout, List, Input, Button, Avatar, Typography, Dropdown, Space } from 'antd';
import EmojiPicker from './EmojiPicker';
import DetailDrawer from './DetailDrawer';
import NotificationDropdown from './NotificationDropdown';
import SearchModal from './SearchModal';
import CreateGroupModal from './CreateGroupModal';
import ProfileModal from './ProfileModal';
import { SendOutlined, UserOutlined, LogoutOutlined, SearchOutlined, PlusOutlined, UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/userSlice';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';
import styles from './styles.module.css';


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

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const username = useSelector((state: RootState) => state.user.username);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 使用WebSocket hook
  const {
    isConnected,
    messages,
    currentContactId,
    sendMessage,
    sendWebSocketMessage,
    setSelectedContact: setWebSocketSelectedContact,
    fetchContacts,
    contacts,
    setContacts,
    logout: webSocketLogout,
    fetchGroupMembers,
    clearNewMessageStatus,
    newMessageContacts,
    notifications,
    clearNotification,
    clearAllNotifications
  } = useWebSocket();

  // 同步更新selectedContact的在线状态
  useEffect(() => {
    if (selectedContact && selectedContact.type === 'personal') {
      const updatedContact = contacts.find(c => c.id === selectedContact.id);
      if (updatedContact && updatedContact.online !== selectedContact.online) {
        setSelectedContact(prev => prev ? { ...prev, online: updatedContact.online } : null);
      }
    }
  }, [contacts, selectedContact]);
  
  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当选中联系人或消息变化时，滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [selectedContact, messages]);

  // 初始化数据
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAcceptRequest = (id: number, type: 'friend' | 'group' | 'group_invite' | 'group_join_request' | 'friend_request') => {
    if (type === 'group_join_request') {
      console.log('同意群聊加入请求:', id);
      // TODO: 实现同意群聊加入请求的逻辑
    } else if (type === 'friend_request') {
      console.log('处理好友请求同意:', { type, notificationId: id });
      
      // 查找对应的通知以获取senderId
      const notification = notifications.find(n => n.id === id);
      if (notification && notification.senderId) {
        const userId = localStorage.getItem('userId');
        if (userId) {
          // 发送同意好友请求的WebSocket消息
          const acceptMessage = {
            action: 6,
            chatMsg: {
              status: true,
              senderId: parseInt(userId),
              receiverId: notification.senderId,
              type: 1
            }
          };
          
          console.log('发送同意好友请求消息:', acceptMessage);
          sendWebSocketMessage(acceptMessage);
          
          // 将新好友添加到联系人列表
          const newContact: Contact = {
            id: notification.senderId,
            name: notification.userName || `用户${notification.senderId}`,
            lastMessage: '',
            unread: 0,
            online: false, // 默认离线状态，后续会通过WebSocket更新
            type: 'personal'
          };
          
          // 检查是否已存在该联系人，避免重复添加
           const existingContact = contacts.find(c => c.id === notification.senderId && c.type === 'personal');
           if (!existingContact) {
             setContacts(prev => [...prev, newContact]);
             console.log('新好友已添加到联系人列表:', newContact);
           } else {
             console.log('联系人已存在，跳过添加:', existingContact);
           }
           
           // 清除对应的通知
           clearNotification(id);
        }
      }
    } else {
      console.log(`接受${type === 'friend' ? '好友' : '群聊'}请求:`, id);
    }
  };

  const handleRejectRequest = (id: number, type: 'friend' | 'group' | 'group_invite' | 'group_join_request' | 'friend_request') => {
    if (type === 'group_join_request') {
      console.log('拒绝群聊加入请求:', id);
      // TODO: 实现拒绝群聊加入请求的逻辑
    } else if (type === 'friend_request') {
      console.log('处理好友请求拒绝:', { type, notificationId: id });
      
      // 查找对应的通知以获取senderId
      const notification = notifications.find(n => n.id === id);
      if (notification && notification.senderId) {
        const userId = localStorage.getItem('userId');
        if (userId) {
          // 发送拒绝好友请求的WebSocket消息
          const rejectMessage = {
            action: 6,
            chatMsg: {
              status: false,
              senderId: parseInt(userId),
              receiverId: notification.senderId,
              type: 1
            }
          };
          
          console.log('发送拒绝好友请求消息:', rejectMessage);
           sendWebSocketMessage(rejectMessage);
           
           // 清除对应的通知
           clearNotification(id);
        }
      }
    } else {
      console.log(`拒绝${type === 'friend' ? '好友' : '群聊'}请求:`, id);
    }
  };

  // 处理删除好友
  const handleDeleteFriend = (friendId: number) => {
    // 如果删除的是当前选中的联系人，清空选中状态
    if (selectedContact && selectedContact.id === friendId) {
      setSelectedContact(null);
      setWebSocketSelectedContact('', 'personal');
    }
    // 刷新联系人列表
    fetchContacts();
  };

  // 处理删除群聊
  const handleDeleteGroup = (groupId: number) => {
    // 如果删除的是当前选中的联系人，清空选中状态
    if (selectedContact && selectedContact.id === groupId) {
      setSelectedContact(null);
      setWebSocketSelectedContact('', 'group');
    }
    // 刷新联系人列表
    fetchContacts();
  };

  const handleSend = () => {
    if (messageInput.trim() && selectedContact && isConnected) {
      // 根据联系人类型确定消息类型：1为私聊，2为群聊
      const messageType = selectedContact.type === 'personal' ? 1 : 2;
      console.log('发送消息:', {
        content: messageInput,
        receiverId: selectedContact.id,
        type: messageType,
        selectedContact
      });
      sendMessage(messageInput, selectedContact.id, messageType);
      setMessageInput('');
    }
  };

  return (
    <Layout className={styles.chatLayout}>
      <Layout style={{ width: '90%', maxWidth: '1400px', height: 'calc(100vh - 64px)' }}>
        <Sider width={280} className={styles.sider}>
          <div className={styles.siderHeader}>
            <div className={styles.groupInfo}>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'profile',
                      icon: <UserOutlined />,
                      label: '个人信息',
                      onClick: () => setProfileModalVisible(true)
                    },
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: '退出登录',
                      danger: true,
                      onClick: async () => {
                        const success = await webSocketLogout();
                        if (success) {
                          dispatch(logout());
                          navigate('/');
                        }
                      }
                    }
                  ]
                }}
                placement="bottomLeft"
                trigger={['click']}
              >
                <Avatar size={36} style={{ backgroundColor: '#6366f1', cursor: 'pointer' }}>{username ? username[0].toUpperCase() : 'U'}</Avatar>
              </Dropdown>
              <div className={styles.userInfo}>
                <Text strong>{localStorage.getItem('userName') || username}</Text>
                <div className={styles.onlineIndicator}>
                  <div className={styles.onlineDot}></div>
                  <Text type="secondary" className={styles.onlineText}>在线</Text>
                </div>
              </div>
            </div>
            <NotificationDropdown
              notifications={notifications}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
              onClear={clearNotification}
              onClearAll={clearAllNotifications}
            />
          </div>
          <div className={styles.searchBox}>
            <Input
              prefix={<SearchOutlined style={{ color: '#6366f1' }} />}
              placeholder="搜索联系人"
              className={styles.searchInput}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'addFriend',
                    icon: <UserAddOutlined />,
                    label: '添加好友/群聊',
                    onClick: () => setSearchModalVisible(true)
                  },
                  {
                    key: 'addGroup',
                    icon: <TeamOutlined />,
                    label: '创建群聊',
                    onClick: () => setCreateGroupModalVisible(true)
                  }
                ]
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="text"
                icon={<PlusOutlined style={{ color: '#6366f1' }} />}
                className={styles.addButton}
              />
            </Dropdown>
          </div>
          <List
            className={styles.contactList}
            dataSource={contacts.filter(contact =>
              contact.name.toLowerCase().includes(searchText.toLowerCase())
            )}
            renderItem={(contact) => (
              <List.Item
                onClick={() => {
                   setSelectedContact({
                     ...contact,
                     members: contact.members?.map(member => ({
                       id: member.userId.toString(),
                       name: member.userName
                     }))
                   });
                   // 清除该联系人的新消息状态，传递联系人类型
                   clearNewMessageStatus(contact.id.toString(), contact.type);
                   setWebSocketSelectedContact(contact.id.toString(), contact.type);
                   // 延迟滚动到底部，确保消息已加载
                   setTimeout(() => {
                     scrollToBottom();
                   }, 100);
                 }}
                className={`${styles.contactItem} ${selectedContact?.id === contact.id ? styles.selected : ''}`}
              >
                <div className={styles.contactInfo}>
                  <div className={styles.avatarWrapper}>
                    {contact.type === 'personal' ? (
                      <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                    ) : (
                      <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#52c41a' }} />
                    )}
                    {contact.type === 'personal' && contact.online && <div className={styles.onlineStatus} />}
                    {contact.hasNewMessage && (
                      <div className={styles.newMessageDot}></div>
                    )}
                  </div>
                  <div className={styles.contactDetails}>
                    <div className={styles.nameContainer}>
                      <Text strong>{contact.name}</Text>
                      <span className={`${styles.typeTag} ${contact.type === 'personal' ? styles.personalTag : styles.groupTag}`}>
                        {contact.type === 'personal' ? '用户' : '群组'}
                      </span>
                    </div>
                    {contact.lastMessage && (
                      <Text type="secondary" className={styles.lastMessage} ellipsis>
                        {contact.lastMessage}
                      </Text>
                    )}
                    {contact.unread > 0 && (
                      <span className={styles.unreadBadge}>{contact.unread}</span>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Sider>
        <Layout className={styles.chatMain}>
          <Header className={styles.chatHeader}>
            {selectedContact && (
              <div className={styles.selectedContactInfo}>
                <Avatar icon={<UserOutlined />} />
                <div className={styles.contactMeta}>
                  <Text strong>{selectedContact.name}</Text>
                  {selectedContact.online && <Text type="secondary" className={styles.onlineText}>online</Text>}
                </div>
                <Button
                  type="text"
                  className={styles.moreButton}
                  onClick={() => setDetailDrawerVisible(true)}
                >
                  •••
                </Button>
              </div>
            )}
          </Header>
          <Content className={styles.chatContent}>
            <div className={styles.messageList}>
              {selectedContact && messages
                 .map((msg) => {
                  // 获取当前用户ID用于判断消息方向
                  const currentUserId = localStorage.getItem('userId');
                  const currentUserName = localStorage.getItem('userName');
                  const isSentByMe = msg.sender === currentUserId || msg.sender === currentUserName;
                  
                  console.log('=== 渲染消息 ===');
                  console.log('消息ID:', msg.id, '内容:', msg.content);
                  console.log('发送者:', msg.sender);
                  console.log('当前用户ID:', currentUserId);
                  console.log('当前用户名:', currentUserName);
                  console.log('是否我发送的:', isSentByMe);
                  
                  // 格式化时间戳
                  const formatTimestamp = (timestamp: string) => {
                    try {
                      const date = new Date(timestamp);
                      return date.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                    } catch {
                      return timestamp;
                    }
                  };
                  
                  return (
                    <div
                      key={msg.id}
                      className={`${styles.messageItem} ${isSentByMe ? styles.sent : styles.received}`}
                    >
                      <div className={styles.messageContent}>
                        {!isSentByMe && (
                          <Text type="secondary" className={styles.senderName}>
                            {msg.userName || msg.sender}
                          </Text>
                        )}
                        <Text>{msg.content}</Text>
                        <Text type="secondary" className={styles.timestamp}>
                          {formatTimestamp(msg.timestamp)}
                        </Text>
                      </div>
                    </div>
                   );
                })}
                {/* 消息底部锚点 */}
                <div ref={messagesEndRef} />
            </div>
          </Content>
          <div className={styles.inputArea}>
            <Space.Compact style={{ flex: 1 }}>
              <EmojiPicker
                onEmojiSelect={(emoji) => setMessageInput(messageInput + emoji)}
              />
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onPressEnter={handleSend}
                placeholder="输入消息"
                disabled={!selectedContact || !isConnected}
                className={styles.messageInput}
              />
            </Space.Compact>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!selectedContact || !isConnected}
              className={styles.sendButton}
            />
          </div>
        </Layout>
      </Layout>
      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSendWebSocketMessage={sendWebSocketMessage}
      />
      <CreateGroupModal
        visible={createGroupModalVisible}
        onClose={() => setCreateGroupModalVisible(false)}
      />
      <DetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        contact={selectedContact ? {
          id: selectedContact.id,
          name: selectedContact.name,
          type: selectedContact.type,
          phone: selectedContact.phone,
          members: selectedContact.members?.map(member => ({
            userId: Number(member.id),
            userName: member.name
          }))
        } : null}
        onFetchGroupMembers={fetchGroupMembers}
        onDeleteFriend={handleDeleteFriend}
        onDeleteGroup={handleDeleteGroup}
      />
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        username={username}
      />
    </Layout>
  );
};

export default Chat;