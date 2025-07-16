import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, LaptopOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../store/userSlice';
import styles from './styles.module.css';

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (values.password === '123456') {
        dispatch(login(values.username));
        message.success({
          content: '登录成功！欢迎回来～',
          className: 'custom-message',
          duration: 2,
          style: {
            marginTop: '20vh',
          },
        });
        navigate('/chat');
      } else {
        throw new Error('密码错误');
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
            name="username"
            rules={[{ required: true, message: '请输入用户名！' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
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