import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import Topbar from '../UI/Topbar';

const SuperAdminLayout = () => {
  return (
    <div className="app-shell">
      <SuperAdminSidebar />
      <div className="app-main">
        <Topbar breadcrumb="Sistema Global" title="Panel Super Admin" />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
