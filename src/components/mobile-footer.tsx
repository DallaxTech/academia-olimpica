'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Users, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const footerNavItems = [
  { href: '/aluno', label: 'Hoje', icon: Home },
  { href: '/aluno/fichas', label: 'Fichas', icon: Search },
  { href: '/aluno/community', label: 'Ranking', icon: Users },
  { href: '/aluno/performance', label: 'Evolução', icon: BarChart },
];

export function MobileFooter() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm z-50">
      <div className="container flex h-16 items-center justify-around">
        {footerNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground transition-colors hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
