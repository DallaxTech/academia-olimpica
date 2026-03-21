'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="User Management"
        description="View and manage all users in the system."
      >
        <Button>Add User</Button>
      </PageHeader>
      <div>
        <p>User management is under construction. Please check back later.</p>
      </div>
    </>
  );
}
