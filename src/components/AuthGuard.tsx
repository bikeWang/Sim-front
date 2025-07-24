import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // 如果没有访问令牌或刷新令牌，跳转到登录页面
      if (!accessToken || !refreshToken) {
        navigate('/', { replace: true });
        return;
      }
    };

    checkAuth();
  }, [navigate]);

  // 检查认证状态
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // 如果没有令牌，不渲染子组件
  if (!accessToken || !refreshToken) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;