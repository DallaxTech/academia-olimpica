'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BrainCircuit, Dumbbell, LayoutDashboard, Users, LayoutGrid, List } from 'lucide-react';
import { doc } from 'firebase/firestore';

import { Role, UserProfile } from '@/lib/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { Logo } from './logo';
import { UserNav } from './user-nav';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { ThemeToggle } from './theme-toggle';
import { useLayout } from './layout-provider';
import { Button } from './ui/button';

const navItems = [
  {
    href: '/dashboard',
    label: 'Painel',
    icon: LayoutDashboard,
    roles: [Role.Admin, Role.Analyst, Role.Athlete],
  },
  {
    href: '/dashboard/workouts',
    label: 'Treinos',
    icon: Dumbbell,
    roles: [Role.Admin, Role.Analyst, Role.Athlete],
  },
  {
    href: '/dashboard/users',
    label: 'Usuários',
    icon: Users,
    roles: [Role.Admin, Role.Analyst],
  },
  {
    href: '/dashboard/ai-recommender',
    label: 'Recomendador IA',
    icon: BrainCircuit,
    roles: [Role.Admin, Role.Analyst],
  },
];

export function MainNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { layout, toggleLayout } = useLayout();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isUserLoading || isProfileLoading;

  const getVisibleItems = () => {
    if (isLoading || !user) {
      return [];
    }
    
    const userRole = user.isAnonymous ? Role.Athlete : userProfile?.roleId;

    if (!userRole) {
      return [];
    }

    return navItems.filter(item => item.roles.includes(userRole));
  };
  
  const visibleItems = getVisibleItems();

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={toggleLayout}>
            {layout === 'list' ? <LayoutGrid className="h-[1.2rem] w-[1.2rem]" /> : <List className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">Alternar Visualização</span>
          </Button>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        {isLoading ? (
          <SidebarMenu>
            <SidebarMenuSkeleton showIcon />
            <SidebarMenuSkeleton showIcon />
            <SidebarMenuSkeleton showIcon />
            <SidebarMenuSkeleton showIcon />
          </SidebarMenu>
        ) : (
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
        )}
      </SidebarContent>
      <div className="p-2 border-t border-border">
        <UserNav />
      </div>
    </Sidebar>
  );
}
