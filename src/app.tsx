import React from 'react';
import { App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

const App: React.FC = () => {
  return (
    <AntdApp>
      <RouterProvider router={router} />
    </AntdApp>
  );
};

export default App;