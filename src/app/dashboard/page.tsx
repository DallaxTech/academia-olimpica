'use client';

import { PageHeader } from '@/components/page-header';
import { useUser } from '@/firebase';


export default function DashboardPage() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  const displayName = user.isAnonymous ? "Guest" : user.email?.split('@')[0] || 'User';

  return (
    <>
      <PageHeader
        title={`Welcome, ${displayName}!`}
        description="Here's a snapshot of your current status."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <p>Your dashboard is being built. Check back soon!</p>
      </div>
    </>
  );
}
