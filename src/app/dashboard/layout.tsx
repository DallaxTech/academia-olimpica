'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import { LayoutProvider, useLayout } from '@/components/layout-provider';
import { MobileFooter } from '@/components/mobile-footer';
import { cn } from '@/lib/utils';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { layout } = useLayout();
  return (
    <>
      <div className="flex h-screen">
        <MainNav />
        <SidebarInset className={cn(
            "p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto",
            layout === 'grid' && 'pb-24 md:pb-8' // Padding for mobile footer
        )}>
          {children}
        </SidebarInset>
      </div>
      {layout === 'grid' && <MobileFooter />}
    </>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <SidebarProvider>
      <LayoutProvider>
        <DashboardContent>
          {children}
        </DashboardContent>
      </LayoutProvider>
    </SidebarProvider>
  );
}
