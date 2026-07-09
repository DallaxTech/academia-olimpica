'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'vertical' | 'horizontal';
  showSubtitle?: boolean;
}

export function Logo({ 
  className, 
  size = 'md', 
  variant = 'vertical',
  showSubtitle = true 
}: LogoProps) {
  const sizeMap = {
    sm: { box: 'w-10 h-10', text: 'text-2xl', icon: '20', subtitle: 'text-[0.55rem]' },
    md: { box: 'w-16 h-16', text: 'text-4xl', icon: '32', subtitle: 'text-[0.6rem]' },
    lg: { box: 'w-24 h-24', text: 'text-5xl', icon: '48', subtitle: 'text-sm' },
    xl: { box: 'w-32 h-32', text: 'text-6xl', icon: '64', subtitle: 'text-base' },
  };

  const config = sizeMap[size];

  return (
    <div className={cn(
      "flex items-center gap-4",
      variant === 'vertical' ? "flex-col" : "flex-row",
      className
    )}>
      {/* Icon Container */}
      <div className={cn(
        "relative flex items-center justify-center rounded-2xl bg-primary shadow-[0_0_30px_rgba(var(--primary),0.2)] shrink-0",
        config.box
      )}>
        <svg 
          width={config.icon} 
          height={config.icon} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-primary-foreground"
        >
          <path d="m6.7 10.1 5.3 5.3 5.3-5.3" />
          <path d="m6.7 5 5.3 5.3 5.3-5.3" />
        </svg>

        {/* Static Rings for visual depth */}
        <div className="absolute inset-[-6px] border border-primary/20 rounded-full" />
        <div className="absolute inset-[-12px] border border-primary/10 rounded-full" />
      </div>

      {/* Text Branding - Always center texts relative to each other */}
      <div className="flex flex-col items-center">
        <h1 className={cn(
          "font-black tracking-tighter text-foreground font-headline uppercase leading-none",
          config.text
        )}>
          Olimpo
        </h1>
        
        {showSubtitle && (
          <>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 my-1" />
            <p className={cn(
              "font-medium tracking-[0.3em] uppercase opacity-60 text-center whitespace-nowrap",
              config.subtitle
            )}>
              Academia Olímpica
            </p>
          </>
        )}
      </div>
    </div>
  );
}
