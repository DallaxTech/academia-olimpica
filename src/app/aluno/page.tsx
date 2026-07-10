'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Dumbbell, Trophy, CalendarDays, Activity, LogOut } from 'lucide-react';
import { useUser, useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

export default function AlunoDashboard() {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (e) {
      console.error('Error signing out', e);
    }
  };

  const firestore = useFirestore();

  // Fetch training plans assigned to this athlete
  const assignedPlansQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'trainingPlans'),
      where('assignedToAthleteIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

  const { data: plans, isLoading: loadingPlans } = useCollection(assignedPlansQuery);
  const activePlan = plans && plans.length > 0 ? plans[0] : null;

  // Query workout sessions for the active plan
  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !activePlan) return null;
    return query(
      collection(firestore, 'userProfiles', user.uid, 'workoutSessions'),
      where('planId', '==', activePlan.id)
    );
  }, [firestore, user, activePlan]);

  const { data: sessions } = useCollection<any>(sessionsQuery);

  // Calculate statistics
  const durationWeeks = activePlan?.durationWeeks || 4;
  const weeklyFrequency = activePlan?.weeklyFrequency || 3;
  const totalExpected = durationWeeks * weeklyFrequency;
  const completedCount = sessions?.length || 0;
  const progressPercent = totalExpected > 0 ? Math.min(100, Math.round((completedCount / totalExpected) * 100)) : 0;
  const isPlanCompleted = completedCount >= totalExpected;

  // Check if completed a session today
  const completedToday = useMemo(() => {
    if (!sessions || sessions.length === 0) return false;
    const todayStr = new Date().toLocaleDateString('pt-BR');
    return sessions.some((s: any) => {
      if (!s.completedAt) return false;
      const date = s.completedAt.toDate ? s.completedAt.toDate() : new Date(s.completedAt);
      return date.toLocaleDateString('pt-BR') === todayStr;
    });
  }, [sessions]);

  // Streak/Progress stats (dynamic streak)
  const streak = completedCount > 0 ? Math.min(7, completedCount) : 0;

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-headline font-bold">Olá, Atleta! 👋</h1>
          <p className="text-muted-foreground">Pronto para o treino de hoje?</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-sm">{streak}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleSignOut} title="Sair">
              <LogOut className="w-[1.2rem] h-[1.2rem]" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Action Card */}
      {loadingPlans ? (
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : activePlan ? (
        <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              {isPlanCompleted ? 'Plano Concluído!' : 'Treino do Dia'}
            </CardTitle>
            <CardDescription>
              {isPlanCompleted ? 'Parabéns pela conquista!' : 'O seu planejamento de hoje'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isPlanCompleted ? (
                <div className="bg-green-500/10 border border-green-500/25 p-5 rounded-xl text-center space-y-3">
                  <Trophy className="w-12 h-12 text-green-500 mx-auto animate-bounce" />
                  <h3 className="font-bold text-lg text-green-500">Parabéns! Você concluiu este plano! 🏆</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Você realizou com sucesso os {totalExpected} treinos planejados. Fale com seu professor para prescrever a sua próxima ficha!
                  </p>
                </div>
              ) : (
                <div className="bg-secondary/40 p-4 rounded-lg border border-border/50 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg">{activePlan.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Activity className="w-4 h-4"/> {activePlan.workoutDaysCount || activePlan.daysCount || 1} dias de treino</span>
                      <p className="text-xs line-clamp-1 mt-1">{activePlan.description}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                      <span>Progresso da Ficha</span>
                      <span>{completedCount} de {totalExpected} treinos ({progressPercent}%)</span>
                    </div>
                    <Progress value={progressPercent} className="h-2 bg-secondary" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            {isPlanCompleted ? (
              <Button 
                className="w-full text-lg h-14 font-bold transition-transform active:scale-95 bg-secondary text-foreground hover:bg-secondary/85" 
                size="lg"
                onClick={() => router.push(`/aluno/treino/${activePlan.id}`)}
              >
                Refazer Treino Extra
              </Button>
            ) : completedToday ? (
              <div className="w-full text-lg h-14 font-bold bg-green-600/10 border border-green-500/30 text-green-500 rounded-xl flex items-center justify-center gap-2 select-none">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Treino de Hoje Concluído! 🔥
              </div>
            ) : (
              <Button 
                className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95" 
                size="lg"
                onClick={() => router.push(`/aluno/treino/${activePlan.id}`)}
              >
                Começar Treino
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-dashed bg-card/30 flex flex-col items-center justify-center p-8 text-center">
          <Dumbbell className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <CardTitle className="text-lg">Nenhum treino vinculado</CardTitle>
          <CardDescription className="mt-2">
            Fale com seu professor para receber sua nova ficha de treinamento.
          </CardDescription>
        </Card>
      )}

      {/* Saúde & Avaliação */}
      <div className="pt-2">
        <Card 
          className="bg-primary/5 border-primary/20 cursor-pointer transition-all hover:bg-primary/10 active:scale-[0.98]"
          onClick={() => router.push('/aluno/anamnese')}
        >
          <CardHeader className="p-4 flex flex-row items-center gap-4">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Anamnese & Saúde</CardTitle>
              <CardDescription>Mantenha seus dados de saúde atualizados</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Progress Track */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Seu Progresso
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50">
            <CardHeader className="p-4 pb-2">
              <CardDescription>Treinos no Mês</CardDescription>
              <CardTitle className="text-2xl">12</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50">
            <CardHeader className="p-4 pb-2">
              <CardDescription>Carga Total (kg)</CardDescription>
              <CardTitle className="text-2xl">4.520</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
