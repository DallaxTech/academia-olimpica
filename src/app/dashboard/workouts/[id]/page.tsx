'use client';

import { use } from 'react';
import { doc, collection } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Calendar, Clock, ChevronRight } from 'lucide-react';

export default function WorkoutDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firestore = useFirestore();

  const planRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'trainingPlans', id);
  }, [firestore, id]);

  const { data: plan, isLoading: isPlanLoading } = useDoc<any>(planRef);

  const daysRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return collection(firestore, `trainingPlans/${id}/workoutDays`);
  }, [firestore, id]);

  const { data: days, isLoading: isDaysLoading } = useCollection<any>(daysRef);

  const isLoading = isPlanLoading || isDaysLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/2 mb-4" />
          <div className="grid gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      ) : plan ? (
        <>
          <PageHeader 
            title={plan.name} 
            description={plan.description || 'Sem descrição.'}
          >
            <div className="flex gap-2">
               <Badge variant="outline" className="bg-primary/5 border-primary/20">
                 {plan.assignedToAthleteIds?.length || 0} Alunos Atribuídos
               </Badge>
            </div>
          </PageHeader>

          <div className="grid gap-8">
            {/* Workout Days */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Estrutura do Treino
              </h2>
              
              {days && days.length > 0 ? (
                <div className="grid gap-6">
                  {days.map((day: any) => (
                    <Card key={day.id} className="bg-card/50 overflow-hidden border-primary/10">
                      <CardHeader className="bg-primary/5 py-4">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{day.name}</span>
                          <Badge variant="outline">{day.exercises?.length || 0} Exercícios</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                          {day.exercises?.map((ex: any, idx: number) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{ex.exerciseName || 'Exercício'}</p>
                                  <p className="text-sm text-muted-foreground">{ex.sets} séries x {ex.reps} reps</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-dashed">
                  <p className="text-muted-foreground">Este plano ainda não possui dias de treino configurados.</p>
                </Card>
              )}
            </div>

            {/* Quick Stats/Info */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <Card className="bg-card/30">
                 <CardHeader className="py-4">
                   <CardDescription className="flex items-center gap-2 text-xs">
                     <Clock className="w-4 h-4" /> Criado em
                   </CardDescription>
                   <CardTitle className="text-sm font-bold mt-1">
                     {plan.createdAt?.toDate ? plan.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recém criado'}
                   </CardTitle>
                 </CardHeader>
               </Card>
            </div>
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <p>Treino não encontrado.</p>
        </Card>
      )}
    </div>
  );
}
