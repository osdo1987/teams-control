import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';

const SuperAdminLayout = () => {
  return (
    <div className="app-container">
      <SuperAdminSidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdminLayout;
