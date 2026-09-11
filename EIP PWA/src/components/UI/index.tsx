import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600',
    success: 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600',
    ghost: 'bg-transparent hover:bg-gray-800 text-white disabled:text-gray-600',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {isLoading && <span className="animate-spin">⟳</span>}
      {children}
    </button>
  );
};

interface BadgeProps {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', size = 'sm', children }) => {
  const variantClasses = {
    default: 'bg-gray-700 text-gray-100',
    success: 'bg-green-700 text-green-100',
    danger: 'bg-red-700 text-red-100',
    warning: 'bg-yellow-700 text-yellow-100',
    info: 'bg-blue-700 text-blue-100',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  return (
    <span className={`font-semibold rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'warning' | 'error' | 'pending';
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
  const statusClasses = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    pending: 'bg-blue-500',
  };

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    warning: 'Warning',
    error: 'Error',
    pending: 'Pending',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${statusClasses[status]} ${
        status === 'active' ? 'animate-pulse' : ''
      }`}></div>
      <span className="text-sm text-gray-300">{label || statusLabels[status]}</span>
    </div>
  );
};

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, onClose }) => {
  const variantClasses = {
    info: 'bg-blue-950 border-blue-700 text-blue-100',
    success: 'bg-green-950 border-green-700 text-green-100',
    warning: 'bg-yellow-950 border-yellow-700 text-yellow-100',
    error: 'bg-red-950 border-red-700 text-red-100',
  };

  const icons = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕',
  };

  return (
    <div className={`border rounded-lg p-4 ${variantClasses[variant]} border-opacity-30`}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{icons[variant]}</span>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <p className="text-sm">{children}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-lg leading-none opacity-70 hover:opacity-100">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

interface TabProps {
  tabs: Array<{ id: string; label: string; icon?: string }>;
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex gap-6 border-b border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-4 font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-white border-b-2 border-blue-600'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
