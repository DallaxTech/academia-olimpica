'use client';

import { Logo } from '@/components/logo';
import { GlobalActions } from './global-actions';

export function AppHeader() {
    return (
        <header className="flex items-center justify-between md:justify-start p-2 border-b shrink-0 w-full relative">
            <div className="flex-1 flex justify-center md:justify-start">
                <Logo size="sm" variant="horizontal" showSubtitle={true} />
            </div>
            <div className="md:static">
                <GlobalActions />
            </div>
        </header>
    );
}
