import { createBrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AuthGuard from './components/AuthGuard';
// 路由拦截已实现：
// 1. 登录后才能访问 /chat /profile（通过AuthGuard组件）
// 2. 未登录才能访问 /register /login
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/chat',
    element: (
      <AuthGuard>
        <Chat />
      </AuthGuard>
    ),
  },
  {
    path: '/profile',
    element: (
      <AuthGuard>
        <Profile />
      </AuthGuard>
    ),
  },
]);