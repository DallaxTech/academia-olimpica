'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Visualize e gerencie todos os usuários no sistema."
      >
        <Button>Adicionar Usuário</Button>
      </PageHeader>
      <div>
        <p>O gerenciamento de usuários está em construção. Por favor, volte mais tarde.</p>
      </div>
    </>
  );
}
