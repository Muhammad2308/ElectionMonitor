import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileTopBar from './MobileTopBar';
import MobileBottomNav from './MobileBottomNav';
import { useTheme } from '../../hooks/useTheme';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const BackgroundOrbs: React.FC = () => (
    <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }} aria-hidden="true">
        <div style={{
            position: 'absolute', top: '-10%', right: '-15%',
            width: '60vmax', height: '60vmax', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
            animation: 'eipOrbFloat2 16s ease-in-out infinite',
        }} />
        <div style={{
            position: 'absolute', bottom: '-20%', left: '-10%',
            width: '50vmax', height: '50vmax', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)',
            animation: 'eipOrbFloat1 18s ease-in-out infinite',
        }} />
        <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
        }} />
    </div>
);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <>
      <style>{`
          @keyframes eipOrbFloat1 {
              0%,100%{ transform:translate(0,0) scale(1); }
              33%    { transform:translate(3%,5%) scale(1.05); }
              66%    { transform:translate(-2%,2%) scale(0.97); }
          }
          @keyframes eipOrbFloat2 {
              0%,100%{ transform:translate(0,0) scale(1); }
              33%    { transform:translate(-4%,-3%) scale(1.07); }
              66%    { transform:translate(2%,4%) scale(0.95); }
          }
      `}</style>
      <div className={`admin-shell ${theme === 'dark' ? 'dark' : 'light'} flex h-screen relative overflow-hidden`}>
        <BackgroundOrbs />
        
        {/* Sidebar — desktop only */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
          {/* Header — desktop only */}
          <Header />
          {/* Top bar — mobile/tablet only */}
          <MobileTopBar />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto" style={{ padding: '32px 40px', paddingBottom: '96px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              {children}
            </div>
          </main>
        </div>

        {/* Bottom tab bar — mobile/tablet only */}
        <MobileBottomNav />
      </div>
    </>
  );
};

export default AdminLayout;
