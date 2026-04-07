'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Dumbbell, CalendarDays, Search } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function FichasAlunoPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  // Buscar todas as fichas vinculadas a este aluno
  const plansQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'trainingPlans'),
      where('assignedToAthleteIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: plans, isLoading } = useCollection(plansQuery);

  if (!user) return null;

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
          <Search className="w-6 h-6 text-primary" />
          Minhas Fichas
        </h1>
        <p className="text-muted-foreground">Histórico de treinos passados pelo seu professor.</p>
      </div>

      <div className="space-y-4 pb-24">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-primary/20 bg-card/50">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : plans && plans.length > 0 ? (
          plans.map((plan: any, idx: number) => (
            <Card key={plan.id} className={`border-primary/20 transition-all hover:border-primary/50 relative overflow-hidden ${idx === 0 ? 'bg-card/80 shadow-lg shadow-primary/10 border-primary/40' : 'bg-card/40'}`}>
              {idx === 0 && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl tracking-wider">
                  Atual
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  {plan.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">{plan.description || "Sem descrição informada."}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1.5 py-1">
                    <CalendarDays className="w-3.5 h-3.5"/> 
                    {plan.daysCount || 0} Dias
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1.5 py-1 opacity-80">
                    <Activity className="w-3.5 h-3.5"/> 
                    Treino Ativo
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className={idx === 0 ? "w-full font-bold" : "w-full variant-outline"} 
                  variant={idx === 0 ? "default" : "secondary"}
                  onClick={() => router.push(`/aluno/treino/${plan.id}`)}
                >
                  {idx === 0 ? "Começar Treino" : "Visualizar Ficha Antiga"}
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="border-dashed bg-card/30 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <Dumbbell className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium text-foreground">Ainda não há fichas</p>
            <p className="text-sm mt-2">Nenhuma ficha foi atrelada ao seu perfil até o momento.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
