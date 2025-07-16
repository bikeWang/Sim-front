import React from 'react';
import { Drawer, Avatar, Input, List, Button, App } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import styles from './detailDrawer.module.css';

interface DetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  contact: {
    id: string;
    name: string;
    type: 'personal' | 'group';
    avatar?: string;
    phone?: string;
    note?: string;
    members?: { id: string; name: string }[];
  } | null;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ visible, onClose, contact }) => {
  const { modal } = App.useApp();
  if (!contact) return null;

  const isPersonal = contact.type === 'personal';

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
      onOk: () => {
        // 这里添加删除操作的处理逻辑
        onClose();
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
                  <span className={styles.memberName}>{member.name}</span>
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