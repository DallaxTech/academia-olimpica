'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BrainCircuit, Dumbbell, LayoutDashboard, Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from './logo';
import { UserNav } from './user-nav';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [Role.Admin, Role.Analyst, Role.Athlete],
  },
  {
    href: '/dashboard/workouts',
    label: 'Workouts',
    icon: Dumbbell,
    roles: [Role.Admin, Role.Analyst, Role.Athlete],
  },
  {
    href: '/dashboard/users',
    label: 'Users',
    icon: Users,
    roles: [Role.Admin, Role.Analyst],
  },
  {
    href: '/dashboard/ai-recommender',
    label: 'AI Recommender',
    icon: BrainCircuit,
    roles: [Role.Admin, Role.Analyst],
  },
];

type MainNavProps = {
  userRole: Role;
};

export function MainNav({ userRole }: MainNavProps) {
  const pathname = usePathname();
  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {visibleItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <div className="p-2 border-t border-border">
        <UserNav />
      </div>
    </Sidebar>
  );
}
