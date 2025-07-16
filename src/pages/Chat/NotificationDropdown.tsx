import React from 'react';
import { List, Typography, Badge, Dropdown } from 'antd';
import { BellOutlined, UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import styles from './notificationDropdown.module.css';

interface NotificationItem {
  id: number;
  type: 'friend' | 'group';
  title: string;
  description: string;
  timestamp: string;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onAccept: (id: number, type: 'friend' | 'group') => void;
  onReject: (id: number, type: 'friend' | 'group') => void;
}

const { Text } = Typography;

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onAccept,
  onReject,
}) => {
  const friendRequests = notifications.filter(item => item.type === 'friend');
  const groupRequests = notifications.filter(item => item.type === 'group');
  const hasNotifications = notifications.length > 0;

  const dropdownContent = (
    <div className={styles.notificationContainer}>
      {friendRequests.length > 0 && (
        <div className={styles.notificationSection}>
          <div className={styles.sectionHeader}>
            <UserAddOutlined />
            <Text strong>好友请求</Text>
          </div>
          <List
            dataSource={friendRequests}
            renderItem={item => (
              <List.Item className={styles.notificationItem}>
                <div className={styles.notificationContent}>
                  <Text strong>{item.title}</Text>
                  <Text type="secondary">{item.description}</Text>
                  <Text type="secondary" className={styles.timestamp}>{item.timestamp}</Text>
                </div>
                <div className={styles.actionButtons}>
                  <a onClick={() => onAccept(item.id, 'friend')}>接受</a>
                  <a onClick={() => onReject(item.id, 'friend')}>拒绝</a>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}
      
      {groupRequests.length > 0 && (
        <div className={styles.notificationSection}>
          <div className={styles.sectionHeader}>
            <TeamOutlined />
            <Text strong>群聊邀请</Text>
          </div>
          <List
            dataSource={groupRequests}
            renderItem={item => (
              <List.Item className={styles.notificationItem}>
                <div className={styles.notificationContent}>
                  <Text strong>{item.title}</Text>
                  <Text type="secondary">{item.description}</Text>
                  <Text type="secondary" className={styles.timestamp}>{item.timestamp}</Text>
                </div>
                <div className={styles.actionButtons}>
                  <a onClick={() => onAccept(item.id, 'group')}>加入</a>
                  <a onClick={() => onReject(item.id, 'group')}>拒绝</a>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}
      
      {!hasNotifications && (
        <div className={styles.emptyState}>
          <Text type="secondary">暂无通知</Text>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge dot={hasNotifications} className={styles.notificationBadge}>
        <BellOutlined className={`${styles.bellIcon} ${hasNotifications ? styles.animate : ''}`} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;