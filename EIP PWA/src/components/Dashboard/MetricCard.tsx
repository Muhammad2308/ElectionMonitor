import React from 'react';

interface MetricCardProps {
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
  default: 'bg-gray-800 border-gray-700',
  warning: 'bg-yellow-950 border-yellow-700 border-opacity-30',
  success: 'bg-green-950 border-green-700 border-opacity-30',
  info: 'bg-blue-950 border-blue-700 border-opacity-30',
};

const iconWrapClasses = {
  default: 'bg-gray-700/50 text-gray-300',
  warning: 'bg-yellow-500/10 text-yellow-400',
  success: 'bg-green-500/10 text-green-400',
  info: 'bg-blue-500/10 text-blue-400',
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
    <div className={`border rounded-xl p-4 sm:p-6 ${variantClasses[variant]}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg ${iconWrapClasses[variant]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 truncate text-xl font-bold text-white sm:mb-1 sm:text-2xl lg:text-3xl">{value}</div>
          <p className="truncate text-xs font-medium text-gray-400 sm:text-sm">{label}</p>
          {subtitle && <p className="mt-0.5 truncate text-[11px] text-gray-500 sm:mt-1 sm:text-xs">{subtitle}</p>}
          {trend && (
            <div className="mt-1 text-xs sm:mt-2">
              <span className={trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}>
                {trend.direction === 'up' ? '+' : '-'} {trend.value}
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
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 sm:mb-8">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricCard;
