import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }));
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' WAT');
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="hidden border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-xl lg:block relative z-10" style={{ padding: '32px 40px' }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center" style={{ gap: '12px', marginBottom: '16px' }}>
            <div className="bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{ width: '12px', height: '12px' }}></div>
            <span className="text-emerald-400 font-bold uppercase tracking-[0.1em]" style={{ fontSize: '12px' }}>Live Monitoring Active</span>
          </div>
          <h1 className="font-black text-white tracking-tight" style={{ fontSize: '42px', lineHeight: '1.2', marginBottom: '8px' }}>Election Command Center</h1>
          <p className="text-slate-400 font-medium" style={{ fontSize: '18px' }}>Observation & Reporting Overview</p>
        </div>

        <div className="text-right flex flex-col items-end" style={{ gap: '8px' }}>
          <div className="text-slate-400 font-semibold tracking-wide uppercase" style={{ fontSize: '14px' }}>{currentDate}</div>
          <div className="font-bold text-white font-mono tracking-tight" style={{ fontSize: '36px' }}>{currentTime}</div>
          <div className="flex items-center" style={{ gap: '8px', marginTop: '16px' }}>
            <div className="bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{ width: '10px', height: '10px' }}></div>
            <span className="text-emerald-400 font-bold uppercase tracking-widest" style={{ fontSize: '12px' }}>System Live</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
