'use client';

import { PageHeader } from '@/components/page-header';

export default function UserProfilePage({ params }: { params: { id: string } }) {

  return (
    <>
      <PageHeader title="Athlete Profile" />
       <div>
        <p>User profiles are under construction. Please check back later.</p>
        <p>User ID: {params.id}</p>
      </div>
    </>
  );
}
