import React, { useState } from 'react';
import { Layout, Form, Input, Button, Avatar, Typography, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import styles from './styles.module.css';

interface UserProfile {
  username: string;
  email: string;
  phone: string;
}

const { Content } = Layout;
const { Title } = Typography;

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const username = useSelector((state: RootState) => state.user.username);
  const [loading, setLoading] = useState(false);

  const initialValues: UserProfile = {
    username: username,
    email: 'user@example.com',
    phone: '1234567890'
  };

  const onFinish = async (_values: UserProfile) => {
    setLoading(true);
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success({
        content: '个人信息更新成功！',
        className: 'custom-message',
        duration: 2,
        style: {
          marginTop: '20vh'
        }
      });
      setTimeout(() => {
        navigate('/chat');
      }, 1500);
    } catch (error) {
      message.error({
        content: '更新失败：' + (error instanceof Error ? error.message : '未知错误'),
        className: 'custom-message',
        duration: 3,
        style: {
          marginTop: '20vh'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className={styles.profileLayout}>
      <Layout style={{ width: '90%', maxWidth: '1400px', height: 'calc(100vh - 64px)' }}>
        <Content className={styles.profileContent}>
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <Avatar size={80} icon={<UserOutlined />} className={styles.profileAvatar} />
              <Title level={2}>个人信息</Title>
            </div>
            <Form
              layout="vertical"
              initialValues={initialValues}
              onFinish={onFinish}
              className={styles.profileForm}
            >
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名！' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入用户名"
                />
              </Form.Item>

              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱！' },
                  { type: 'email', message: '请输入有效的邮箱地址！' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="请输入邮箱"
                />
              </Form.Item>

              <Form.Item
                label="手机号码"
                name="phone"
                rules={[{ required: true, message: '请输入手机号码！' }]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="请输入手机号码"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className={styles.submitButton}
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Profile;