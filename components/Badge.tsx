import React from 'react';
import { cn } from '@/lib/utils';


// I'll avoid installing cva for now since I didn't plan for it, 
// just use a simple map or string interpolation.
// Actually, I didn't install cva, so I'll just use standard logic with cn.

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'info' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variants = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

const sizes = {
  sm: "text-xs px-2 py-0.5 rounded",
  md: "text-sm px-2.5 py-1 rounded-md",
  lg: "text-base px-3 py-1.5 rounded-lg",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
