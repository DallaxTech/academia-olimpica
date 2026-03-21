'use client';

import React from 'react';
import { PageHeader } from '@/components/page-header';
import { useUser } from '@/firebase';


export default function WorkoutsPage() {
  const { user } = useUser();

  if (!user) return null;

  return (
     <>
      <PageHeader
        title="Treinos"
        description="Gerencie e visualize os planos de treino."
      />
      <div>
        <p>A seção de treinos está em construção. Por favor, volte mais tarde.</p>
      </div>
    </>
  );
};
