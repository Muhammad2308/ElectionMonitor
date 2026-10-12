import React from 'react';

export interface MetricCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  subtitle?: string;
  variant?: 'default' | 'warning' | 'success' | 'info';
  trend?: {
    value: number | string;
    direction: 'up' | 'down';
  };
}

const variantClasses = {
  default: 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50',
  warning: 'bg-gradient-to-br from-yellow-900/30 to-slate-900/80 border-yellow-700/30',
  success: 'bg-gradient-to-br from-emerald-900/30 to-slate-900/80 border-emerald-700/30',
  info: 'bg-gradient-to-br from-blue-900/30 to-slate-900/80 border-blue-700/30',
};

const iconWrapClasses = {
  default: 'bg-slate-700/50 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
  warning: 'bg-yellow-500/20 text-yellow-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
  success: 'bg-emerald-500/20 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
  info: 'bg-blue-500/20 text-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
};

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  value,
  label,
  subtitle,
  variant = 'default',
  trend,
}) => {
  return (
    <div className={`border rounded-3xl backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${variantClasses[variant]}`} style={{ padding: '32px' }}>
      <div className="flex items-start" style={{ gap: '24px' }}>
        <div className={`flex shrink-0 items-center justify-center rounded-2xl ${iconWrapClasses[variant]}`} style={{ width: '56px', height: '56px' }}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-black text-white tracking-tight" style={{ fontSize: '36px', lineHeight: '1.2', marginBottom: '8px' }}>{value}</div>
          <p className="truncate font-bold uppercase tracking-wider text-slate-400" style={{ fontSize: '14px' }}>{label}</p>
          {subtitle && <p className="truncate font-medium text-slate-500" style={{ fontSize: '12px', marginTop: '6px' }}>{subtitle}</p>}
          {trend && (
            <div style={{ marginTop: '12px', fontSize: '12px' }}>
              <span className={`inline-flex items-center font-bold ${trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`} style={{ gap: '6px' }}>
                {trend.direction === 'up' ? '↗' : '↘'} {trend.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MetricsGridProps {
  metrics: MetricCardProps[];
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8 sm:mb-10">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricCard;
