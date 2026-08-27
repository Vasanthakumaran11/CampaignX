import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'indigo';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', children, ...props }) => {
  const variantStyles = {
    default: 'bg-amber-100 text-amber-900 border-amber-300',
    secondary: 'bg-slate-100 text-slate-800 border-slate-300',
    outline: 'bg-transparent text-slate-700 border-slate-300',
    success: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    warning: 'bg-amber-100 text-amber-900 border-amber-300',
    destructive: 'bg-rose-100 text-rose-900 border-rose-300',
    indigo: 'bg-amber-200 text-slate-950 border-amber-400 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
