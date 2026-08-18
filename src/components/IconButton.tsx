import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
  variant?: 'default' | 'danger';
};

export function IconButton({ label, icon, variant = 'default', className = '', ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      className={`icon-button icon-button--${variant} ${className}`.trim()}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
