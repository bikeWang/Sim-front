import React from 'react';
import { List, Typography, Badge, Dropdown } from 'antd';
import { BellOutlined, UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import styles from './notificationDropdown.module.css';

interface NotificationItem {
  id: number;
  type: 'friend' | 'group' | 'group_invite';
  title: string;
  description: string;
  timestamp: string;
  groupName?: string;
  senderId?: number;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onAccept?: (id: number, type: 'friend' | 'group' | 'group_invite') => void;
  onReject?: (id: number, type: 'friend' | 'group' | 'group_invite') => void;
  onClear?: (id: number) => void;
  onClearAll?: () => void;
}

const { Text } = Typography;

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onAccept,
  onReject,
  onClear,
  onClearAll,
}) => {
  // 按时间排序，新消息在前面
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const friendRequests = sortedNotifications.filter(item => item.type === 'friend');
  const groupRequests = sortedNotifications.filter(item => item.type === 'group');
  const groupInvites = sortedNotifications.filter(item => item.type === 'group_invite');
  const hasNotifications = sortedNotifications.length > 0;

  const dropdownContent = (
    <div className={styles.notificationContainer}>
      {hasNotifications && (
        <div className={styles.headerActions}>
          <Text strong>通知</Text>
          {onClearAll && (
            <a onClick={onClearAll} className={styles.clearAllButton}>清空全部</a>
          )}
        </div>
      )}
      
      {groupInvites.length > 0 && (
        <div className={styles.notificationSection}>
          <div className={styles.sectionHeader}>
            <TeamOutlined />
            <Text strong>群聊通知</Text>
          </div>
          <List
            dataSource={groupInvites}
            renderItem={item => (
              <List.Item className={styles.notificationItem}>
                <div className={styles.notificationContent}>
                  <Text strong>{item.title}</Text>
                  <Text type="secondary">{item.description}</Text>
                  <Text type="secondary" className={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </div>
                <div className={styles.actionButtons}>
                  {onClear && (
                    <a onClick={() => onClear(item.id)}>知道了</a>
                  )}
                </div>
              </List.Item>
            )}
          />
        </div>
      )}
      
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
                  <Text type="secondary" className={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </div>
                <div className={styles.actionButtons}>
                  {onAccept && <a onClick={() => onAccept(item.id, 'friend')}>接受</a>}
                  {onReject && <a onClick={() => onReject(item.id, 'friend')}>拒绝</a>}
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
                  <Text type="secondary" className={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </div>
                <div className={styles.actionButtons}>
                  {onAccept && <a onClick={() => onAccept(item.id, 'group')}>加入</a>}
                  {onReject && <a onClick={() => onReject(item.id, 'group')}>拒绝</a>}
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