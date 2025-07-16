import React, { useState } from 'react';
import { Input, Typography, List, Avatar, Empty } from 'antd';
import { SearchOutlined, UserOutlined, TeamOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './searchModal.module.css';

interface SearchResult {
  id: number;
  name: string;
  type: 'user' | 'group';
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const { Text } = Typography;

const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([
    { id: 1, name: '张三', type: 'user' },
    { id: 2, name: '李四', type: 'user' },
    { id: 3, name: '技术交流群', type: 'group' },
  ]);

  const handleSearch = (value: string) => {
    // 模拟搜索功能
    const results = searchResults.filter(item =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults(results);
  };

  if (!visible) return null;

  const users = searchResults.filter(item => item.type === 'user');
  const groups = searchResults.filter(item => item.type === 'group');

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.closeButton} onClick={onClose}>
          <CloseOutlined />
        </div>
        
        <div className={styles.searchSection}>
          <Input
            size="large"
            placeholder="搜索用户或群组"
            prefix={<SearchOutlined style={{ color: '#6366f1' }} />}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              handleSearch(e.target.value);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.resultsSection}>
          {/* 用户搜索结果 */}
          <div className={styles.resultCategory}>
            <div className={styles.categoryHeader}>
              <UserOutlined style={{ color: '#6366f1' }} />
              <Text strong>用户</Text>
            </div>
            {users.length > 0 ? (
              <List
                dataSource={users}
                renderItem={item => (
                  <List.Item className={styles.resultItem}>
                    <Avatar icon={<UserOutlined />} />
                    <Text>{item.name}</Text>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="未找到相关用户"
                className={styles.emptyState}
              />
            )}
          </div>

          {/* 群组搜索结果 */}
          <div className={styles.resultCategory}>
            <div className={styles.categoryHeader}>
              <TeamOutlined style={{ color: '#6366f1' }} />
              <Text strong>群组</Text>
            </div>
            {groups.length > 0 ? (
              <List
                dataSource={groups}
                renderItem={item => (
                  <List.Item className={styles.resultItem}>
                    <Avatar icon={<TeamOutlined />} />
                    <Text>{item.name}</Text>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="未找到相关群组"
                className={styles.emptyState}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;