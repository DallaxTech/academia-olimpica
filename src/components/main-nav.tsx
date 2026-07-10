'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BrainCircuit, Dumbbell, LayoutDashboard, Users, BookOpen, Wrench, Activity, ClipboardList } from 'lucide-react';
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
import { GlobalActions } from './global-actions';

const navItems = [
  {
    href: '/dashboard',
    label: 'Painel',
    icon: LayoutDashboard,
    roles: [Role.Admin, Role.Analyst, Role.Professor],
  },
  {
    href: '/dashboard/workouts',
    label: 'Treinos',
    icon: Dumbbell,
    roles: [Role.Admin, Role.Analyst, Role.Professor],
  },
  {
    href: '/dashboard/workouts/exercises',
    label: 'Exercícios',
    icon: BookOpen,
    roles: [Role.Admin, Role.Analyst, Role.Professor],
  },
  {
    href: '/dashboard/equipment',
    label: 'Equipamentos',
    icon: Wrench,
    roles: [Role.Admin, Role.Analyst, Role.Professor],
  },
  {
    href: '/dashboard/users',
    label: 'Usuários',
    icon: Users,
    roles: [Role.Admin],
  },
  {
    href: '/dashboard/alunos',
    label: 'Alunos',
    icon: Users,
    roles: [Role.Admin, Role.Analyst, Role.Professor],
  },
  {
    href: '/dashboard/bioimpedance',
    label: 'Bioimpedância',
    icon: Activity,
    roles: [Role.Admin, Role.Analyst, Role.Professor],
  },
  {
    href: '/dashboard/ai-recommender',
    label: 'Recomendador IA',
    icon: BrainCircuit,
    roles: [Role.Admin, Role.Analyst, Role.Professor],
  },
  {
    href: '/dashboard/cadastros',
    label: 'Cadastros',
    icon: ClipboardList,
    roles: [Role.Admin, Role.Analyst, Role.Professor],
  },
];

export function MainNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
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
        <Logo size="sm" variant="horizontal" className="px-2" />
        <GlobalActions />
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
