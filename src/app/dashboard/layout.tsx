'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { LayoutProvider, useLayout } from '@/components/layout-provider';
import { MobileFooter } from '@/components/mobile-footer';
import { cn } from '@/lib/utils';
import { Role, UserProfile } from '@/lib/types';


// This component contains the actual layout structure and logic
function DashboardApp({ children }: { children: React.ReactNode }) {
    const { layout, setLayout } = useLayout();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [initialLayoutSet, setInitialLayoutSet] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'userProfiles', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    // Set default layout based on role
    useEffect(() => {
        if (isProfileLoading || initialLayoutSet || isUserLoading) return;

        const userRole = user?.isAnonymous ? Role.Athlete : userProfile?.roleId;
        if (userRole) {
            setLayout(userRole === Role.Athlete ? 'grid' : 'list');
            setInitialLayoutSet(true);
        }
    }, [isProfileLoading, isUserLoading, user, userProfile, initialLayoutSet, setLayout]);

    // Handle loading state until the layout is determined
    const isLoading = isUserLoading || (!initialLayoutSet && !user?.isAnonymous);
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-[250px]" />
          </div>
        </div>
      );
    }
    
    const showSidebar = layout === 'list';

    return (
        <SidebarProvider>
            <div className="flex h-screen">
                {showSidebar && <MainNav />}
                <SidebarInset className={cn(
                    "p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto",
                    !showSidebar && 'pb-24' // Add padding for the footer
                )}>
                {children}
                </SidebarInset>
            </div>
            {!showSidebar && <MobileFooter />}
        </SidebarProvider>
    );
}

// The main layout component which provides context and handles auth redirection
export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [isUserLoading, user, router]);
    
    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-[250px]" />
                </div>
            </div>
        );
    }

    return (
        <LayoutProvider>
            <DashboardApp>
                {children}
            </DashboardApp>
        </LayoutProvider>
    );
}
