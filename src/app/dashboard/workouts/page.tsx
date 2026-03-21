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
        title="Workouts"
        description="Manage and view workout plans."
      />
      <div>
        <p>The workout section is currently under construction. Please check back later.</p>
      </div>
    </>
  );
};
