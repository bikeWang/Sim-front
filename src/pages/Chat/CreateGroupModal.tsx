import React, { useState } from 'react';
import { Input, Typography, List, Avatar, Button, Checkbox, message } from 'antd';
import { SearchOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './createGroupModal.module.css';

interface Friend {
  id: number;
  name: string;
}

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

const { Text } = Typography;

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ visible, onClose }) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  
  // 模拟好友列表数据
  const friends: Friend[] = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '王五' },
    { id: 4, name: '赵六' },
  ];

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleFriendSelect = (friend: Friend, checked: boolean) => {
    if (checked) {
      setSelectedFriends([...selectedFriends, friend]);
    } else {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
    }
  };

  const handleCreateGroup = () => {
    if (selectedFriends.length < 2) {
      message.warning('请至少选择两个好友');
      return;
    }
    message.success({
      content: '群聊创建成功！',
      duration: 2,
      style: {
        marginTop: '64px'
      }
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.closeButton} onClick={onClose}>
          <CloseOutlined />
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.friendsList}>
            <div className={styles.searchSection}>
              <Input
                placeholder="搜索好友"
                prefix={<SearchOutlined style={{ color: '#6366f1' }} />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <List
              className={styles.list}
              dataSource={filteredFriends}
              renderItem={friend => (
                <List.Item className={styles.friendItem}>
                  <Checkbox
                    checked={selectedFriends.some(f => f.id === friend.id)}
                    onChange={(e) => handleFriendSelect(friend, e.target.checked)}
                    className={styles.checkbox}
                  />
                  <Avatar icon={<UserOutlined />} />
                  <Text>{friend.name}</Text>
                </List.Item>
              )}
            />
          </div>

          <div className={styles.selectedFriends}>
            <Text strong className={styles.sectionTitle}>已选择的好友</Text>
            <List
              className={styles.selectedList}
              dataSource={selectedFriends}
              renderItem={friend => (
                <List.Item className={styles.selectedItem}>
                  <Avatar icon={<UserOutlined />} />
                  <Text>{friend.name}</Text>
                </List.Item>
              )}
            />
            <div className={styles.buttonGroup}>
              <Button
                type="primary"
                onClick={handleCreateGroup}
                className={styles.createButton}
                disabled={selectedFriends.length < 2}
              >
                创建群聊
              </Button>
              <Button onClick={onClose}>取消</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;