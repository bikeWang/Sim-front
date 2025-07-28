import React, { useState, useEffect } from 'react';
import { Input, Typography, List, Avatar, Empty, Button, Spin } from 'antd';
import { SearchOutlined, UserOutlined, TeamOutlined, CloseOutlined } from '@ant-design/icons';
import { get, post } from '../../utils/request';
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // 获取推荐好友
  const fetchRecommendedFriends = async () => {
    setIsLoading(true);
    try {
      const data = await get('/api/users/recommended');
      
      // 假设API返回格式: { users: [...], groups: [...] }
      const results: SearchResult[] = [
        ...data.users.map((user: any) => ({ id: user.id, name: user.name, type: 'user' as const })),
        ...data.groups.map((group: any) => ({ id: group.id, name: group.name, type: 'group' as const }))
      ];
      setSearchResults(results);
    } catch (error) {
      console.error('获取推荐好友失败:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索功能
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      fetchRecommendedFriends();
      return;
    }

    setIsSearching(true);
    try {
      const data = await post('/api/users/search', { keyword: searchValue.trim() });
      
      // 假设API返回格式: { users: [...], groups: [...] }
      const results: SearchResult[] = [
        ...data.users.map((user: any) => ({ id: user.id, name: user.name, type: 'user' as const })),
        ...data.groups.map((group: any) => ({ id: group.id, name: group.name, type: 'group' as const }))
      ];
      setSearchResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 初始化时获取推荐好友
  useEffect(() => {
    if (visible) {
      fetchRecommendedFriends();
    }
  }, [visible]);

  // 重置状态
  useEffect(() => {
    if (!visible) {
      setSearchValue('');
      setSearchResults([]);
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [visible]);

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
          <div className={styles.searchInputWrapper}>
            <Input
              size="large"
              placeholder="搜索用户或群组"
              prefix={<SearchOutlined style={{ color: '#6366f1' }} />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={handleSearch}
              className={styles.searchInput}
            />
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              className={styles.searchButton}
              loading={isSearching}
            >
              搜索
            </Button>
          </div>
        </div>

        <div className={styles.resultsSection}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <Text className={styles.loadingText}>正在加载推荐好友...</Text>
            </div>
          ) : isSearching ? (
            <div className={styles.searchingContainer}>
              <div className={styles.searchingIcon}>
                <SearchOutlined className={styles.animatedSearch} />
              </div>
              <Text className={styles.searchingText}>正在搜索...</Text>
            </div>
          ) : (
            <>
               {!searchValue && (
                 <div className={styles.recommendedHeader}>
                   <Text strong className={styles.recommendedTitle}>推荐用户</Text>
                 </div>
               )}
               
               {/* 用户搜索结果 */}
               {users.length > 0 && (
                 <div className={styles.resultCategory}>
                   <div className={styles.categoryHeader}>
                     <UserOutlined style={{ color: '#6366f1' }} />
                     <Text strong>用户</Text>
                   </div>
                   <List
                     dataSource={users}
                     renderItem={item => (
                       <List.Item className={styles.resultItem}>
                         <div className={styles.resultInfo}>
                           <Avatar icon={<UserOutlined />} />
                           <Text>{item.name}</Text>
                         </div>
                         <Button
                           type="primary"
                           size="small"
                           className={styles.addButton}
                         >
                           添加好友
                         </Button>
                       </List.Item>
                     )}
                   />
                 </div>
               )}

               {/* 群组搜索结果 */}
               {groups.length > 0 && (
                 <div className={styles.resultCategory}>
                   <div className={styles.categoryHeader}>
                     <TeamOutlined style={{ color: '#6366f1' }} />
                     <Text strong>群组</Text>
                   </div>
                   <List
                     dataSource={groups}
                     renderItem={item => (
                       <List.Item className={styles.resultItem}>
                         <div className={styles.resultInfo}>
                           <Avatar icon={<TeamOutlined />} />
                           <Text>{item.name}</Text>
                         </div>
                         <Button
                           type="primary"
                           size="small"
                           className={styles.addButton}
                         >
                           加入群聊
                         </Button>
                       </List.Item>
                     )}
                   />
                 </div>
               )}
               
               {/* 空状态 */}
               {searchResults.length === 0 && !isLoading && !isSearching && (
                 <Empty
                   image={Empty.PRESENTED_IMAGE_SIMPLE}
                   description={searchValue ? "未找到相关结果" : "暂无推荐用户"}
                   className={styles.emptyState}
                 />
               )}
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;