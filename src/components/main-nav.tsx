'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BrainCircuit, Dumbbell, LayoutDashboard, Users } from 'lucide-react';
import { doc } from 'firebase/firestore';

import { cn } from '@/lib/utils';
import { Role, UserProfile } from '@/lib/types';
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
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';

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

export function MainNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Default to athlete role if not loaded or anonymous
  const userRole = userProfile?.roleId || (user?.isAnonymous ? Role.Athlete : null);
  
  const visibleItems = navItems.filter(item => userRole && item.roles.includes(userRole));

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {visibleItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5 mr-2" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
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
