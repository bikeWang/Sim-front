import React, { useState } from 'react';
import { Modal, Form, Input, Button, App, Divider, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
}

interface ProfileForm {
  username: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const { Text } = Typography;

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose, username }) => {
  const [form] = Form.useForm<ProfileForm>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleSubmit = async (values: ProfileForm) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('新密码与确认密码不匹配');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/user-info/user/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          username: values.username,
          oldPassword: values.oldPassword,
          newPassword: values.newPassword
        })
      });

      const data = await response.json();
      if (data.code === 200) {
        message.success('个人信息更新成功');
        onClose();
        form.resetFields();
      } else {
        message.error(data.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Text strong style={{ fontSize: '18px' }}>编辑个人信息</Text>}
      open={visible}
      onCancel={onClose}
      footer={null}
      maskClosable={false}
      width={420}
      centered
      className="profile-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ username }}
        size="large"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text type="secondary">基本信息</Text>
            <Divider style={{ margin: '12px 0' }} />
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#6366f1' }} />}
                placeholder="请输入新的用户名"
                allowClear
              />
            </Form.Item>
          </div>

          <div>
            <Text type="secondary">修改密码</Text>
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Form.Item
                name="oldPassword"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#6366f1' }} />}
                  placeholder="请输入当前密码"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                rules={[{ required: true, message: '请输入新密码' }]}
              >
                <Input.Password
                  prefix={<KeyOutlined style={{ color: '#6366f1' }} />}
                  placeholder="请输入新密码"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                rules={[{ required: true, message: '请确认新密码' }]}
              >
                <Input.Password
                  prefix={<KeyOutlined style={{ color: '#6366f1' }} />}
                  placeholder="请再次输入新密码"
                />
              </Form.Item>
            </Space>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: '40px',
                background: '#6366f1',
                borderColor: '#6366f1',
                boxShadow: '0 2px 0 rgba(99, 102, 241, 0.1)'
              }}
            >
              保存修改
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default ProfileModal;