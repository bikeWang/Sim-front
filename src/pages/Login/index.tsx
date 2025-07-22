import React, { useState } from 'react';
import { Form, Input, Button, App } from 'antd';
import { UserOutlined, LockOutlined, LaptopOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

import styles from './styles.module.css';

interface LoginForm {
  userName: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      // 使用fetch从测试API获取是否登录
      const response = await fetch('/api/user-info/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      console.log(data);
      if (data.code === 200) {
        message.success({
          content: '登录成功！',
          className: 'custom-message',
          duration: 3,
        });
        //跳转到聊天页面，local本地保存双token
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        console.log(localStorage.getItem('accessToken'));
        console.log(localStorage.getItem('refreshToken'));
      }
    } catch (error) {
      message.error({
        content: '登录失败：' + (error instanceof Error ? error.message : '未知错误'),
        className: 'custom-message',
        duration: 3,
        style: {
          marginTop: '20vh',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.iconContainer}>
          <LaptopOutlined />
        </div>
        <h1 className={styles.title}>简聊</h1>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="userName"
            rules={[{ required: true, message: '请输入用户名！' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              LOGIN
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.forgotPassword}>
          Forgot Username / Password?
        </div>

        <div className={styles.createAccount}>
          没有账户?<Link to="/register">点击这里！快速创建自己的账户！</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;