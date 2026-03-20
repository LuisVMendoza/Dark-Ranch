import logoHorizontal from '../assets/dark-ranch-logo-horizontal.svg';
import logoCircular from '../assets/dark-ranch-logo-circular.svg';
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Assets
export const LOGO_HORIZONTAL = logoHorizontal;
export const LOGO_CIRCULAR = logoCircular;

// Components
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'western', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-black text-white hover:bg-neutral-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
      secondary: 'bg-[#C4A484] text-black hover:bg-[#B39373] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
      outline: 'bg-transparent border-2 border-black text-black hover:bg-black hover:text-white',
      ghost: 'bg-transparent text-black hover:bg-neutral-100 border-transparent',
      western: 'bg-[#3d2b1f] text-[#d4c5b3] hover:bg-[#4d3b2f] border-2 border-[#d4c5b3] font-western tracking-wider'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-10 py-4 text-lg font-bold tracking-wider uppercase',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none font-header tracking-tight',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

export const SectionTitle = ({ children, subtitle, className, light }: { children: React.ReactNode, subtitle?: string, className?: string, light?: boolean }) => (
  <div className={cn("mb-12", className)}>
    {subtitle && <p className={cn("font-header uppercase tracking-[0.2em] text-sm mb-2", light ? "text-[#d4c5b3]" : "text-[#C4A484]")}>{subtitle}</p>}
    <h2 className={cn("text-4xl md:text-6xl font-western uppercase tracking-tight relative inline-block", light ? "text-white" : "text-black")}>
      {children}
      <div className={cn("absolute -bottom-4 left-0 w-24 h-1.5", light ? "bg-[#d4c5b3]" : "bg-black")}></div>
    </h2>
  </div>
);

export const PaperCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "bg-[#fdfcf5] p-8 border-2 border-[#d4c5b3] shadow-[inset_0_0_50px_rgba(212,197,179,0.2)] relative",
    "after:absolute after:inset-0 after:bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] after:opacity-10 after:pointer-events-none",
    className
  )}>
    {children}
  </div>
);

export const OrnateBorder = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center gap-4 py-8", className)}>
    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#C4A484] to-transparent"></div>
    <div className="text-[#C4A484] rotate-45 border-2 border-[#C4A484] p-1">
      <div className="w-2 h-2 bg-[#C4A484]"></div>
    </div>
    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#C4A484] to-transparent"></div>
  </div>
);

export const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("px-2 py-1 text-[10px] uppercase font-bold tracking-widest bg-black text-white", className)}>
    {children}
  </span>
);

export const Divider = ({ className }: { className?: string }) => (
  <div className={cn("w-full h-px bg-neutral-200 my-8 flex items-center justify-center relative", className)}>
    <div className="w-4 h-4 bg-neutral-100 border border-neutral-200 rotate-45 absolute"></div>
  </div>
);
