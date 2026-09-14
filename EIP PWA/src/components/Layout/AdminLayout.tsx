import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileTopBar from './MobileTopBar';
import MobileBottomNav from './MobileBottomNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header — desktop only */}
        <Header />
        {/* Top bar — mobile/tablet only */}
        <MobileTopBar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          <div className="p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom tab bar — mobile/tablet only */}
      <MobileBottomNav />
    </div>
  );
};

export default AdminLayout;
