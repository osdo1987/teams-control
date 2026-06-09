import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';

const SuperAdminLayout = () => {
  return (
    <div className="app-shell">
      <SuperAdminSidebar />
      <div className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
