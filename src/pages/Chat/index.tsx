import React, { useState } from 'react';
import { Layout, List, Input, Button, Avatar, Typography, Dropdown, Space } from 'antd';
import EmojiPicker from './EmojiPicker';
import NotificationDropdown from './NotificationDropdown';
import SearchModal from './SearchModal';
import CreateGroupModal from './CreateGroupModal';
import { SendOutlined, UserOutlined, SettingOutlined, LogoutOutlined, SearchOutlined, PlusOutlined, UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/userSlice';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import styles from './styles.module.css';

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
}

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const username = useSelector((state: RootState) => state.user.username);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);

  // 模拟通知数据
  const [notifications] = useState([
    {
      id: 1,
      type: 'friend' as const,
      title: '张三',
      description: '请求添加你为好友',
      timestamp: '10:30'
    },
    {
      id: 2,
      type: 'group' as const,
      title: '前端交流群',
      description: '邀请你加入群聊',
      timestamp: '11:45'
    }
  ]);

  const handleAcceptRequest = (id: number, type: 'friend' | 'group') => {
    console.log(`接受${type === 'friend' ? '好友' : '群聊'}请求:`, id);
  };

  const handleRejectRequest = (id: number, type: 'friend' | 'group') => {
    console.log(`拒绝${type === 'friend' ? '好友' : '群聊'}请求:`, id);
  };

  // 模拟联系人数据
  const contacts: Contact[] = [
    { id: 1, name: '未凉', lastMessage: '好的，明天见！', unread: 2, online: true },
    { id: 2, name: '海阔', lastMessage: '有人在吗？', unread: 0, online: true },
    { id: 3, name: '天空', lastMessage: '收到了吗？', unread: 1, online: false },
    { id: 4, name: '海图', lastMessage: '晚安！', unread: 0, online: false },
  ];

  // 模拟消息数据
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: '未凉',
      content: 'Ceetpudtims onlihia',
      timestamp: '14:00',
    },
    {
      id: 2,
      sender: username,
      content: 'Onalfcae merodiar',
      timestamp: '14:01',
    },
    {
      id: 3,
      sender: '未凉',
      content: 'Sair tvcice circautemintation',
      timestamp: '14:02',
    },
  ]);

  const handleSend = () => {
    if (messageInput.trim() && selectedContact) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: username,
        content: messageInput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
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
                      onClick: () => navigate('/profile')
                    },
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: '退出登录',
                      danger: true,
                      onClick: () => {
                        dispatch(logout());
                        navigate('/');
                      }
                    }
                  ]
                }}
                placement="bottomLeft"
                trigger={['click']}
              >
                <Avatar size={36} style={{ backgroundColor: '#6366f1', cursor: 'pointer' }}>{username[0].toUpperCase()}</Avatar>
              </Dropdown>
              <Text strong>Chat Group</Text>
            </div>
            <NotificationDropdown
                notifications={notifications}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
              />
          </div>
          <div className={styles.searchBox}>
            <Input
              prefix={<SearchOutlined style={{ color: '#6366f1' }} />}
              placeholder="搜索联系人"
              className={styles.searchInput}
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
            dataSource={contacts}
            renderItem={(contact) => (
              <List.Item
                onClick={() => setSelectedContact(contact)}
                className={`${styles.contactItem} ${selectedContact?.id === contact.id ? styles.selected : ''}`}
              >
                <div className={styles.contactInfo}>
                  <div className={styles.avatarWrapper}>
                    <Avatar icon={<UserOutlined />} />
                    {contact.online && <div className={styles.onlineStatus} />}
                  </div>
                  <div className={styles.contactDetails}>
                    <Text strong>{contact.name}</Text>
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
              </div>
            )}
          </Header>
          <Content className={styles.chatContent}>
            <div className={styles.messageList}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.messageItem} ${msg.sender === username ? styles.sent : styles.received}`}
                >
                  <div className={styles.messageContent}>
                    <Text>{msg.content}</Text>
                    <Text type="secondary" className={styles.timestamp}>
                      {msg.timestamp}
                    </Text>
                  </div>
                </div>
              ))}
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
                placeholder="Demo"
                disabled={!selectedContact}
                className={styles.messageInput}
              />
            </Space.Compact>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!selectedContact}
              className={styles.sendButton}
            />
          </div>
        </Layout>
      </Layout>
      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
      />
      <CreateGroupModal
        visible={createGroupModalVisible}
        onClose={() => setCreateGroupModalVisible(false)}
      />
    </Layout>
  );
};

export default Chat;