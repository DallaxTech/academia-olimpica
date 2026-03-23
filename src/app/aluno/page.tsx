'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Dumbbell, Trophy, CalendarDays, Activity, LogOut } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from 'firebase/auth';

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

  // Mock data for UI demonstration
  const streak = 3;
  const nextWorkout = {
    id: 'wk-123',
    name: 'Série A - Peito e Tríceps',
    duration: '45 min',
    exercises: 6
  };

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
      <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Treino do Dia
          </CardTitle>
          <CardDescription>O seu planejamento de hoje</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-secondary/40 p-4 rounded-lg border border-border/50">
              <h3 className="font-bold text-lg">{nextWorkout.name}</h3>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Activity className="w-4 h-4"/> {nextWorkout.exercises} exercícios</span>
                <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4"/> {nextWorkout.duration}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95" 
            size="lg"
            onClick={() => router.push(`/aluno/treino/${nextWorkout.id}`)}
          >
            Começar Treino
          </Button>
        </CardFooter>
      </Card>

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
