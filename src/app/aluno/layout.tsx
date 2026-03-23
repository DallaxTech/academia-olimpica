'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileFooter } from '@/components/mobile-footer';

export default function AlunoLayout({ children }: { children: React.ReactNode; }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [isUserLoading, user, router]);
    
    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-[250px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground pb-20">
            {children}
            <MobileFooter />
        </div>
    );
}
