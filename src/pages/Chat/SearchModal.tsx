import React, { useState, useEffect } from 'react';
import { Input, Typography, List, Avatar, Empty, Button, Spin, message } from 'antd';
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
  onSendWebSocketMessage?: (message: any) => void;
}

const { Text } = Typography;

const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose, onSendWebSocketMessage }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // 处理添加好友请求
  const handleAddFriend = (friendId: number) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      message.error('请先登录');
      return;
    }

    const wsMessage = {
      action: 6,
      chatMsg: {
        senderId: parseInt(userId),
        receiverId: friendId,
        type: 3
      }
    };

    if (onSendWebSocketMessage) {
      onSendWebSocketMessage(wsMessage);
      message.success('好友请求已发送');
      console.log('发送添加好友请求:', wsMessage);
    } else {
      message.error('WebSocket连接异常');
    }
  };

  // 处理加入群聊请求
  const handleJoinGroup = (groupId: number) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      message.error('请先登录');
      return;
    }

    const wsMessage = {
      action: 5,
      chatMsg: {
        senderId: parseInt(userId),
        groupId: groupId,
        type: 3
      }
    };

    if (onSendWebSocketMessage) {
      onSendWebSocketMessage(wsMessage);
      message.success('群聊申请已发送');
      console.log('发送加入群聊请求:', wsMessage);
    } else {
      message.error('WebSocket连接异常');
    }
  };

  // 获取推荐好友
  const fetchRecommendedFriends = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('用户未登录');
        setSearchResults([]);
        return;
      }
      
      const data = await get(`/api/user-info/friend/findRecommendFriend?userId=${userId}`);
      
      // 根据新的API返回格式处理数据: { code: 200, msg: "OK", data: [...] }
      if (data.code === 200 && data.data) {
        const results: SearchResult[] = data.data.map((user: any) => ({
          id: user.userId,
          name: user.userName,
          type: 'user' as const
        }));
        setSearchResults(results);
      } else {
        console.error('获取推荐好友失败:', data.msg);
        setSearchResults([]);
      }
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
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('用户未登录');
        setSearchResults([]);
        return;
      }

      // 判断输入内容类型：纯数字为1，其他为2
      const searchContent = searchValue.trim();
      const type = /^\d+$/.test(searchContent) ? 1 : 2;

      const data = await get(`/api/user-info/user/getSearchInfo?userId=${userId}&type=${type}&searchName=${encodeURIComponent(searchContent)}`);
      
      // 根据新的API返回格式处理数据，过滤掉已添加的项目
      if (data.code === 200 && data.data) {
        const results: SearchResult[] = data.data
          .filter((item: any) => item.type === false) // 只渲染type为false的项目
          .map((item: any) => {
            if (item.userVo && item.userVo.user) {
              // 用户类型
              return {
                id: item.userVo.user.userId,
                name: item.userVo.user.userName,
                type: 'user' as const
              };
            } else if (item.group) {
              // 群组类型
              return {
                id: item.group.groupId,
                name: item.group.groupName,
                type: 'group' as const
              };
            }
            return null;
          })
          .filter(Boolean); // 过滤掉null值
        
        setSearchResults(results);
      } else {
        console.error('搜索失败:', data.msg);
        setSearchResults([]);
      }
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
                           onClick={() => handleAddFriend(item.id)}
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
                           onClick={() => handleJoinGroup(item.id)}
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