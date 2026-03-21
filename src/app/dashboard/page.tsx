'use client';

import { PageHeader } from '@/components/page-header';
import { useUser } from '@/firebase';


export default function DashboardPage() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  const displayName = user.isAnonymous ? "Convidado" : user.email?.split('@')[0] || 'Usuário';

  return (
    <>
      <PageHeader
        title={`Bem-vindo(a), ${displayName}!`}
        description="Aqui está um resumo do seu status atual."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <p>Seu painel está em construção. Volte em breve!</p>
      </div>
    </>
  );
}
