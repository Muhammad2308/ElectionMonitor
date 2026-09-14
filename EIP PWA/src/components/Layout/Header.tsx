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
    <header className="hidden border-b border-gray-800 bg-gray-900 px-8 py-6 lg:block">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-semibold uppercase tracking-wide">Live Monitoring Active</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Election Command Center</h1>
          <p className="text-gray-400 text-lg">Observation & Reporting Overview</p>
        </div>

        <div className="text-right space-y-2">
          <div className="text-gray-400 text-sm">{currentDate}</div>
          <div className="text-3xl font-bold text-white font-mono">{currentTime}</div>
          <div className="flex justify-end gap-2 mt-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-400 text-xs font-semibold uppercase tracking-wide">System Live</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
