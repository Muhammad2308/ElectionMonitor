import React from 'react';

interface MetricCardProps {
  icon: string;
  value: number | string;
  label: string;
  subtitle?: string;
  variant?: 'default' | 'warning' | 'success' | 'info';
  trend?: {
    value: number | string;
    direction: 'up' | 'down';
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  value,
  label,
  subtitle,
  variant = 'default',
  trend,
}) => {
  const variantClasses = {
    default: 'bg-gray-800 border-gray-700',
    warning: 'bg-yellow-950 border-yellow-700 border-opacity-30',
    success: 'bg-green-950 border-green-700 border-opacity-30',
    info: 'bg-blue-950 border-blue-700 border-opacity-30',
  };

  return (
    <div className={`border rounded-lg p-6 ${variantClasses[variant]}`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <div className="text-4xl font-bold text-white mb-1">{value}</div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          {trend && (
            <div className="mt-2 text-xs">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricCard;
