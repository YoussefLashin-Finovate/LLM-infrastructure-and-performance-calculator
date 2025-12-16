/**
 * Reusable Badge Component
 * For status indicators and labels
 */

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'info' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  success: {
    bg: '#d1fae5',
    color: '#047857',
    border: '#10b981'
  },
  info: {
    bg: 'var(--primary-100)',
    color: 'var(--primary-700)',
    border: 'var(--primary-500)'
  },
  warning: {
    bg: 'var(--warning-50)',
    color: 'var(--warning-600)',
    border: 'var(--warning-500)'
  },
  error: {
    bg: 'var(--error-50)',
    color: 'var(--error-600)',
    border: 'var(--error-500)'
  },
  neutral: {
    bg: 'var(--neutral-100)',
    color: 'var(--neutral-700)',
    border: 'var(--neutral-300)'
  }
};

const sizeStyles = {
  sm: {
    fontSize: 'var(--font-size-xs)',
    padding: '2px var(--spacing-xs)',
    borderRadius: 'var(--radius-sm)'
  },
  md: {
    fontSize: 'var(--font-size-sm)',
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    borderRadius: 'var(--radius-sm)'
  },
  lg: {
    fontSize: 'var(--font-size-base)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--radius-md)'
  }
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <span
      className={`badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: vStyle.bg,
        color: vStyle.color,
        border: `1px solid ${vStyle.border}`,
        fontSize: sStyle.fontSize,
        padding: sStyle.padding,
        borderRadius: sStyle.borderRadius,
        fontWeight: 'var(--font-weight-semibold)',
        whiteSpace: 'nowrap',
        transition: 'all var(--transition-fast)'
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
