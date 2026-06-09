import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;