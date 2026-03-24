'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Dumbbell, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function WorkoutsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const trainingPlansRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'trainingPlans'),
      where('createdByUserId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: plans, isLoading } = useCollection(trainingPlansRef);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Treinos"
        description="Crie e gerencie as fichas de treinamento da sua academia."
      >
        <Button asChild>
          <Link href="/dashboard/workouts/novo">
            <PlusCircle className="w-4 h-4 mr-2" /> Nova Ficha
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-card/50">
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {plans.map((plan: any) => (
            <Card key={plan.id} className="bg-card/50 hover:bg-card border-primary/10 transition-colors group">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="secondary">
                    {plan.assignedToAthleteIds?.length || 0} Alunos
                  </Badge>
                </div>
                <CardTitle className="mt-4">{plan.name}</CardTitle>
                <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {plan.createdAt?.toDate ? plan.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recém criado'}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5" asChild>
                  <Link href={`/dashboard/workouts/${plan.id}`}>
                    Ver Detalhes
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-card/30">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>Nenhuma ficha encontrada</CardTitle>
          <CardDescription className="max-w-xs mt-2">
            Você ainda não criou nenhuma ficha de treino. Comece criando sua primeira agora mesmo!
          </CardDescription>
          <Button className="mt-6" asChild>
            <Link href="/dashboard/workouts/novo">
              Criar Primeira Ficha
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}

