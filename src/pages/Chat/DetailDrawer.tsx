import React, { useEffect } from 'react';
import { Drawer, Avatar, Input, List, Button, App, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { del } from '../../utils/request';
import styles from './detailDrawer.module.css';

interface DetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  contact: {
    id: number;
    name: string;
    type: 'personal' | 'group';
    avatar?: string;
    phone?: string;
    note?: string;
    members?: { userId: number; userName: string }[];
  } | null;
  onFetchGroupMembers?: (groupId: number) => Promise<{ userId: number; userName: string }[]>;
  onDeleteFriend?: (friendId: number) => void; // 删除好友成功后的回调函数
  onDeleteGroup?: (groupId: number) => void; // 删除群聊成功后的回调函数
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ visible, onClose, contact, onFetchGroupMembers, onDeleteFriend, onDeleteGroup }) => {
  const { modal } = App.useApp();
  
  // 当群聊详情打开时，自动获取群成员列表
  useEffect(() => {
    if (visible && contact && contact.type === 'group' && onFetchGroupMembers) {
      onFetchGroupMembers(contact.id);
    }
  }, [visible, contact, onFetchGroupMembers]);
  
  if (!contact) return null;

  const isPersonal = contact.type === 'personal';

  // 删除好友API调用函数
  const deleteFriend = async (operatorId: number, friendId: number) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('用户未登录');
        return false;
      }

      const data = await del(`/api/user-info/friend/deleteFriend?userId=${operatorId}&friendId=${friendId}`);
      
      if (data.code === 200) {
        message.success('删除好友成功');
        return true;
      } else {
        message.error(data.message || '删除好友失败');
        return false;
      }
    } catch (error) {
      console.error('删除好友请求失败:', error);
      message.error('网络错误，删除好友失败');
      return false;
    }
  };

  // 删除群聊API调用函数
  const deleteGroup = async (userId: number, groupId: number) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('用户未登录');
        return false;
      }

      const data = await del(`/api/user-info/group/outGroup?userId=${userId}&groupId=${groupId}`);
      
      if (data.code === 200) {
        message.success('删除群聊成功');
        return true;
      } else {
        message.error(data.message || '删除群聊失败');
        return false;
      }
    } catch (error) {
      console.error('删除群聊请求失败:', error);
      message.error('网络错误，删除群聊失败');
      return false;
    }
  };

  const handleDelete = () => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除${isPersonal ? '好友' : '群聊'} "${contact.name}" 吗？`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { 
        danger: true,
        style: { fontWeight: 'bold' }
      },
      cancelButtonProps: {
        style: { marginRight: '8px' }
      },
      centered: true,
      maskClosable: false,
      className: styles.deleteModal,
      onOk: async () => {
        if (isPersonal) {
          // 删除好友逻辑
          const currentUserId = localStorage.getItem('userId');
          if (!currentUserId) {
            message.error('用户信息不完整');
            return;
          }
          
          const success = await deleteFriend(currentUserId, contact.id.toString());
           if (success) {
             // 调用回调函数刷新联系人列表
             if (onDeleteFriend) {
               onDeleteFriend(contact.id);
             }
             onClose();
           }
        } else {
          // 删除群聊逻辑
          const currentUserId = localStorage.getItem('userId');
          if (!currentUserId) {
            message.error('用户信息不完整');
            return;
          }
          
          const success = await deleteGroup(parseInt(currentUserId), contact.id);
          if (success) {
            // 调用回调函数刷新联系人列表
            if (onDeleteGroup) {
              onDeleteGroup(contact.id);
            }
            onClose();
          }
        }
      }
    });
  };

  return (
    <Drawer
      title={`${isPersonal ? '联系人' : '群聊'}详情`}
      placement="right"
      onClose={onClose}
      open={visible}
      width={300}
      className={styles.drawer}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <Avatar
            size={64}
            src={contact.avatar}
            icon={<UserOutlined />}
            className={styles.avatar}
          />
          <h2 className={styles.name}>{contact.name}</h2>
        </div>

        {isPersonal ? (
          <div className={styles.personalInfo}>
            <div className={styles.infoItem}>
              <span className={styles.label}>手机号</span>
              <span className={styles.value}>{contact.phone || '未设置'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>备注</span>
              <Input
                placeholder="添加备注"
                defaultValue={contact.note}
                className={styles.noteInput}
              />
            </div>
          </div>
        ) : (
          <div className={styles.groupInfo}>
            <h3 className={styles.membersTitle}>群成员 ({contact.members?.length || 0})</h3>
            <List
              className={styles.membersList}
              dataSource={contact.members || []}
              renderItem={member => (
                <List.Item className={styles.memberItem}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span className={styles.memberName}>{member.userName}</span>
                </List.Item>
              )}
            />
          </div>
        )}

        <Button
          danger
          type="primary"
          className={styles.deleteButton}
          onClick={handleDelete}
        >
          {isPersonal ? '删除好友' : '删除群聊'}
        </Button>
      </div>
    </Drawer>
  );
};

export default DetailDrawer;