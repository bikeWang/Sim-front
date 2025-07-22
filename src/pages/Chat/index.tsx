import React, { useState, useEffect } from 'react';
import { Layout, List, Input, Button, Avatar, Typography, Dropdown, Space } from 'antd';
import EmojiPicker from './EmojiPicker';
import DetailDrawer from './DetailDrawer';
import NotificationDropdown from './NotificationDropdown';
import SearchModal from './SearchModal';
import CreateGroupModal from './CreateGroupModal';
import ProfileModal from './ProfileModal';
import { SendOutlined, UserOutlined, LogoutOutlined, SearchOutlined, PlusOutlined, UserAddOutlined, TeamOutlined, RobotOutlined } from '@ant-design/icons';
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

  // 使用WebSocket hook
  const { isConnected, messages, contacts, sendMessage, fetchHistoryMessages, fetchContacts } = useWebSocket();

  // 初始化数据
  useEffect(() => {
    fetchHistoryMessages();
    fetchContacts();
  }, [fetchHistoryMessages, fetchContacts]);

  const handleAcceptRequest = (id: number, type: 'friend' | 'group') => {
    console.log(`接受${type === 'friend' ? '好友' : '群聊'}请求:`, id);
  };

  const handleRejectRequest = (id: number, type: 'friend' | 'group') => {
    console.log(`拒绝${type === 'friend' ? '好友' : '群聊'}请求:`, id);
  };

  const handleSend = () => {
    if (messageInput.trim() && selectedContact && isConnected) {
      sendMessage(messageInput, selectedContact.id);
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
                <Avatar size={36} style={{ backgroundColor: '#6366f1', cursor: 'pointer' }}>{username ? username[0].toUpperCase() : 'U'}</Avatar>
              </Dropdown>
              <Text strong>Chat Group</Text>
            </div>
            <NotificationDropdown
              notifications={[]}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
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
                onClick={() => setSelectedContact(contact)}
                className={`${styles.contactItem} ${selectedContact?.id === contact.id ? styles.selected : ''}`}
              >
                <div className={styles.contactInfo}>
                  <div className={styles.avatarWrapper}>
                    <Avatar icon={contact.id === 0 ? <RobotOutlined /> : <UserOutlined />} style={contact.id === 0 ? { backgroundColor: '#6366f1' } : undefined} />
                    {contact.online && <div className={styles.onlineStatus} />}
                  </div>
                  <div className={styles.contactDetails}>
                    <div className={styles.nameContainer}>
                      <Text strong>{contact.name}</Text>
                      <span className={`${styles.typeTag} ${contact.type === 'personal' ? styles.personalTag : styles.groupTag}`}>
                        {contact.type === 'personal' ? 'P' : 'G'}
                      </span>
                    </div>
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
      />
      <CreateGroupModal
        visible={createGroupModalVisible}
        onClose={() => setCreateGroupModalVisible(false)}
      />
      <DetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        contact={selectedContact ? {
          ...selectedContact,
          id: String(selectedContact.id)
        } : null}
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