'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { useUser } from '@/firebase';
import { useLayout } from '@/components/layout-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Flame, History, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AppView() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardContent className="p-2 md:p-4 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                    />
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Flame className="text-primary"/>
                            <span>Sessões de Hoje</span>
                        </CardTitle>
                        <CardDescription>Seu treino agendado para hoje.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col items-center justify-center text-center p-6">
                        <p className="text-muted-foreground mb-4">Nenhum treino para hoje.</p>
                        <Button>Ver Plano de Treino</Button>
                    </CardContent>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Dumbbell className="text-primary"/>
                            <span>Meus Treinos</span>
                        </CardTitle>
                        <CardDescription>Seus planos de treino ativos.</CardDescription>
                    </CardHeader>
                     <CardContent className="flex-grow flex flex-col items-center justify-center text-center p-6">
                        <p className="text-muted-foreground mb-4">Você não tem planos de treino.</p>
                        <Button variant="secondary">Explorar Treinos</Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="text-primary"/>
                        <span>Histórico de Sessões</span>
                    </CardTitle>
                    <CardDescription>Suas sessões de treino recentes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-24 text-muted-foreground">
                        <p>Nenhuma sessão recente encontrada.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function DesktopView() {
    const { user } = useUser();
    if (!user) return null;
    const displayName = user.isAnonymous ? "Convidado" : user.email?.split('@')[0] || 'Usuário';

    return (
        <>
            <PageHeader
                title={`Bem-vindo(a), ${displayName}!`}
                description="Aqui está um resumo do seu status atual."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <p>Alterne para a visualização em grade para uma experiência de aplicativo.</p>
            </div>
        </>
    );
}


export default function DashboardPage() {
  const { user } = useUser();
  const { layout } = useLayout();

  if (!user) {
    return null;
  }

  return layout === 'grid' ? <AppView /> : <DesktopView />;
}
