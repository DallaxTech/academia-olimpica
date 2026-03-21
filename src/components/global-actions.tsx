'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useLayout } from '@/components/layout-provider';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export function GlobalActions() {
    const { layout, toggleLayout } = useLayout();

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleLayout}>
                {layout === 'list' ? <LayoutGrid className="h-[1.2rem] w-[1.2rem]" /> : <List className="h-[1.2rem] w-[1.2rem]" />}
                <span className="sr-only">Alternar Visualização</span>
            </Button>
            <ThemeToggle />
        </div>
    );
}
