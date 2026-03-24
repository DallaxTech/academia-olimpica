'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, AlertCircle, Activity, PlusCircle, Dumbbell } from 'lucide-react';
import { useUser } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { GlobalActions } from '@/components/global-actions';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useUser();

  // Mock data
  const metrics = {
    totalStudents: 142,
    activeThisWeek: 118,
    absentStudents: 24, // Alunos sumidos há mais de 7 dias
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <PageHeader 
        title="Painel do Professor" 
        description="Visão geral da sua academia e alunos."
      >
         <div className="hidden md:flex">
           <GlobalActions />
         </div>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalStudents}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos na Semana</CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{metrics.activeThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% em relação à semana passada</p>
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Alerta de Faltas (7+ dias)</CardTitle>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{metrics.absentStudents}</div>
            <Button variant="link" className="px-0 h-auto text-destructive mt-1">Ver lista para cobrança →</Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            className="h-24 text-lg justify-start px-6 bg-secondary/50 hover:bg-secondary text-foreground hover:text-foreground border border-border" 
            variant="outline"
            onClick={() => router.push('/dashboard/workouts/novo')}
          >
            <Dumbbell className="w-6 h-6 mr-4 text-primary" />
            <div className="text-left">
              <div>Montar Nova Ficha</div>
              <div className="text-sm font-normal text-muted-foreground">Criar um treino do zero</div>
            </div>
          </Button>

          <Button 
            className="h-24 text-lg justify-start px-6 bg-secondary/50 hover:bg-secondary text-foreground hover:text-foreground border border-border" 
            variant="outline"
            onClick={() => router.push('/dashboard/users')}
          >
            <Users className="w-6 h-6 mr-4 text-primary" />
            <div className="text-left">
              <div>Gerenciar Acessos</div>
              <div className="text-sm font-normal text-muted-foreground">Editar permissões de alunos e professores</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
