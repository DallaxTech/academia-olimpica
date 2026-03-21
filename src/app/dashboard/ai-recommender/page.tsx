'use client';

import { PageHeader } from '@/components/page-header';

export default function AiRecommenderPage() {
  return (
    <>
      <PageHeader
        title="Recomendador de Treino com IA"
        description="Gere sugestões de treino personalizadas para atletas."
      />
      <div className="grid md:grid-cols-2 gap-8">
        <p>O Recomendador com IA está em construção. Por favor, volte mais tarde.</p>
      </div>
    </>
  );
}
