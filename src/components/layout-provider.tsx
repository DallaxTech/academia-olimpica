'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export type LayoutView = 'list' | 'grid';

type LayoutContextType = {
  layout: LayoutView;
  setLayout: (layout: LayoutView) => void;
  toggleLayout: () => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<LayoutView>('list');

  const toggleLayout = () => {
    setLayout((prev) => (prev === 'list' ? 'grid' : 'list'));
  };

  const value = useMemo(
    () => ({ layout, setLayout, toggleLayout }),
    [layout]
  );

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
