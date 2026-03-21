'use client';

import { PageHeader } from '@/components/page-header';

export default function UserProfilePage({ params }: { params: { id: string } }) {

  return (
    <>
      <PageHeader title="Perfil do Atleta" />
       <div>
        <p>Os perfis de usuário estão em construção. Por favor, volte mais tarde.</p>
        <p>ID do Usuário: {params.id}</p>
      </div>
    </>
  );
}
