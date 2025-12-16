/**
 * Reusable Result Card Component
 * Professional display for calculation results
 */

import React from 'react';

export interface ResultCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'success' | 'info' | 'warning' | 'error';
  icon?: string;
  className?: string;
}

const variantStyles = {
  success: {
    bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    border: 'var(--success-500)',
    titleColor: '#047857',
    valueColor: '#047857'
  },
  info: {
    bg: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
    border: 'var(--primary-500)',
    titleColor: 'var(--primary-700)',
    valueColor: 'var(--primary-700)'
  },
  warning: {
    bg: 'linear-gradient(135deg, var(--warning-50) 0%, #fef3c7 100%)',
    border: 'var(--warning-500)',
    titleColor: 'var(--warning-600)',
    valueColor: 'var(--warning-600)'
  },
  error: {
    bg: 'linear-gradient(135deg, var(--error-50) 0%, #fee2e2 100%)',
    border: 'var(--error-500)',
    titleColor: 'var(--error-600)',
    valueColor: 'var(--error-600)'
  }
};

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  subtitle,
  variant = 'success',
  icon,
  className = ''
}) => {
  const style = variantStyles[variant];

  return (
    <div
      className={`result-card ${className}`}
      style={{
        background: style.bg,
        borderLeft: `4px solid ${style.border}`,
        padding: 'var(--spacing-md) var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--transition-base)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        {icon && (
          <span style={{ fontSize: 'var(--font-size-xl)', opacity: 0.8 }}>
            {icon}
          </span>
        )}
        <h4
          style={{
            margin: subtitle ? '0 0 var(--spacing-xs) 0' : '0',
            fontSize: 'var(--font-size-base)',
            color: style.titleColor,
            fontWeight: 'var(--font-weight-semibold)'
          }}
        >
          {title}
        </h4>
      </div>
      <div
        className="result-value"
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: style.valueColor,
          lineHeight: 'var(--line-height-tight)',
          marginTop: subtitle ? 'var(--spacing-xs)' : '0'
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--neutral-600)',
            marginTop: 'var(--spacing-xs)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default ResultCard;
