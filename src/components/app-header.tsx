'use client';

import { Logo } from '@/components/logo';
import { GlobalActions } from './global-actions';

export function AppHeader() {
    return (
        <header className="flex items-center justify-between p-2 border-b shrink-0">
            <Logo />
            <GlobalActions />
        </header>
    );
}
