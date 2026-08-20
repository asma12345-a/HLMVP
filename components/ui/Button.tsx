import React from 'react';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/audio';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  playClickSound?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', playClickSound = true, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (playClickSound && !props.disabled) {
        soundManager.playClick(variant === 'primary' ? 650 : 520);
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 select-none",
          "px-6 py-4 w-full active:scale-[0.98]",
          {
            "bg-[#1890FF] text-white shadow-[0_4px_0_#0070cc] hover:bg-[#1683eb] active:shadow-none active:translate-y-1": variant === 'primary',
            "bg-[#003270] text-white shadow-[0_4px_0_#001d42] hover:bg-[#002a5c] active:shadow-none active:translate-y-1": variant === 'secondary',
            "border-2 border-[#E5E7EB] bg-white text-[#4B5563] shadow-[0_4px_0_#E5E7EB] hover:bg-gray-50 active:shadow-none active:translate-y-1": variant === 'outline',
            "text-[#1890FF] hover:bg-[#EBF5FF]": variant === 'ghost',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
