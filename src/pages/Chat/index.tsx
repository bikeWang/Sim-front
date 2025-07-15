import React, { useState } from 'react';
import { Layout, List, Input, Button, Avatar, Typography, Dropdown } from 'antd';
import { SendOutlined, UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
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
            <Text type="secondary" className={styles.settingText}>Setting</Text>
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
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onPressEnter={handleSend}
              placeholder="Demo"
              disabled={!selectedContact}
              className={styles.messageInput}
            />
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
    </Layout>
  );
};

export default Chat;