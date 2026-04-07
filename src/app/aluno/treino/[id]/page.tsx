'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ChevronLeft, ArrowRight, Play, Timer, Trophy, Dumbbell, Loader2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ExerciseVideo } from '@/components/exercise-video';

// No mock data needed here anymore

export default function WorkoutPlayer({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { id: planId } = use(params);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  // Fetch plan info
  const { data: plan, isLoading: loadingPlan } = useDoc(useMemoFirebase(() => doc(firestore!, 'trainingPlans', planId), [firestore, planId]));

  // Fetch workout days
  const daysQuery = useMemoFirebase(() => {
    if (!firestore || !planId) return null;
    return query(collection(firestore, 'trainingPlans', planId, 'workoutDays'), orderBy('dayOrder', 'asc'));
  }, [firestore, planId]);

  const { data: days, isLoading: loadingDays } = useCollection(daysQuery);

  const activeDay = days?.find(d => d.id === selectedDayId);
  const exercises = activeDay?.exercises || [];

  // Memoize the exercise cards to prevent video resets while timer is running
  const memoizedExercises = useMemo(() => exercises.map((ex: any, index: number) => {
    const setsDone = completedSets[ex.id] || 0;
    const setsCount = parseInt(ex.sets as string) || 0;
    const isExerciseComplete = setsDone >= setsCount;

    return (
      <CarouselItem key={ex.id || `exercise-${index}`}>
        <Card className={`border-2 transition-colors duration-300 shadow-xl ${isExerciseComplete ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
          <div className="w-full h-64 bg-black flex items-center justify-center rounded-t-lg relative overflow-hidden group/video">
             {ex.videoUrl ? (
               <ExerciseVideo url={ex.videoUrl} className="w-full h-full" />
             ) : (
               <Play className="w-12 h-12 text-muted-foreground/20" />
             )}
             <span className="absolute top-3 right-3 bg-black/60 text-white px-2.5 py-1 text-[10px] rounded-full font-bold tracking-wider uppercase backdrop-blur-md border border-white/10 z-20 shadow-lg">
               {ex.target || 'Exercício'}
             </span>
          </div>

          <CardHeader className="text-center pt-6">
            <CardTitle className="text-2xl font-headline font-bold leading-tight">{ex.name}</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-8 text-center bg-background rounded-lg py-4 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Séries</p>
                <p className="text-2xl font-bold font-mono">{setsCount}</p>
              </div>
              <div className="w-px bg-border"></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Rep. alvo</p>
                <p className="text-2xl font-bold font-mono text-primary">{ex.reps}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium pt-2 text-center text-muted-foreground">Progresso do Exercício</p>
              {Array.from({ length: setsCount }).map((_, i) => (
                <div 
                  key={i} 
                  onClick={() => i === setsDone && handleCompleteSet(ex.id, setsCount, parseInt(ex.rest as string) || 60)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                     i < setsDone ? 'bg-primary/20 border-primary text-primary' : 
                     i === setsDone ? 'bg-secondary border-border shadow-md transform hover:scale-[1.02]' : 
                     'bg-transparent border-transparent opacity-50 pointer-events-none'
                  }`}
                >
                  <span className="font-semibold text-lg">Série {i + 1}</span>
                  {i < setsDone ? (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  ) : i === setsDone ? (
                    <div className="w-6 h-6 rounded-full border-2 border-primary/50 flex items-center justify-center"></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-border"></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CarouselItem>
    );
  }), [exercises, completedSets]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((t) => (t !== null && t > 0 ? t - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleCompleteSet = (exerciseId: string, maxSets: number, restSeconds: number) => {
    const currentSets = completedSets[exerciseId] || 0;
    if (currentSets < maxSets) {
      setCompletedSets({ ...completedSets, [exerciseId]: currentSets + 1 });
      setRestTimer(restSeconds);
    }
    
    // Auto-advance se foi a última série e não é o último exercício
    if (currentSets + 1 >= maxSets && current < exercises.length - 1) {
      setTimeout(() => {
         api?.scrollNext();
      }, 800);
    }
  };

  const handleFinishWorkout = () => {
    setIsFinished(true);
    // Real implementation estaria salvando o log no Firebase aqui
    setTimeout(() => {
      router.push('/aluno');
    }, 3500);
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-headline font-bold mb-2">Treino Concluído!</h1>
        <p className="text-muted-foreground mb-8">Mais um dia para a conta. Bom descanso!</p>
        <Progress value={100} className="w-full max-w-xs h-3" />
      </div>
    );
  }

  if (loadingPlan || loadingDays) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Carregando seu treino...</p>
      </div>
    );
  }

  if (!selectedDayId) {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6 animate-in fade-in duration-500">
        <header className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push('/aluno')} className="mr-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold truncate">{plan?.name || 'Treino'}</h1>
        </header>

        <div className="flex-1 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-headline font-bold">Qual o treino de hoje?</h2>
            <p className="text-muted-foreground">Selecione uma das opções abaixo para começar.</p>
          </div>

          <div className="grid gap-4 mt-8">
            {days?.map((day: any) => (
              <Card 
                key={day.id} 
                className="hover:border-primary/50 transition-all cursor-pointer group active:scale-[0.98]"
                onClick={() => setSelectedDayId(day.id)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {day.name}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{day.exercises?.length || 0} Exercícios</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {day.exercises?.slice(0, 3).map((e: any) => e.name).join(', ')}...
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progress = exercises.length > 0 ? ((current) / (exercises.length - 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="flex items-center p-4 border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push('/aluno')} className="mr-2">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold truncate leading-none">{plan?.name} - Dia {activeDay?.name}</h2>
          <p className="text-xs text-muted-foreground mt-1">Exercício {current + 1} de {exercises.length}</p>
        </div>
        {restTimer !== null && restTimer > 0 && (
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full animate-pulse transition-all">
            <Timer className="w-4 h-4" />
            <span className="font-mono font-medium text-sm">00:{restTimer.toString().padStart(2, '0')}</span>
          </div>
        )}
      </header>
      
      {/* Progress Bar */}
      <Progress value={progress} className="w-full h-1.5 rounded-none" />

      {/* Main Carousel */}
      <main className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full p-4 relative">
        <Carousel setApi={setApi} className="w-full" opts={{ watchDrag: false }}>
          <CarouselContent>
            {memoizedExercises}
          </CarouselContent>
        </Carousel>

        {/* Action Buttons below carousel */}
        <div className="mt-8 flex gap-3">
           <Button 
             variant="outline" 
             size="lg" 
             className="flex-1 h-14"
             onClick={() => api?.scrollPrev()}
             disabled={current === 0}
           >
             Anterior
           </Button>
           
           {current === exercises.length - 1 ? (
             <Button 
               size="lg" 
               className="flex-1 h-14 shadow-lg shadow-green-600/20 bg-green-600 hover:bg-green-700 text-white font-bold"
               onClick={handleFinishWorkout}
             >
               Finalizar Treino
             </Button>
           ) : (
             <Button 
               size="lg" 
               className="flex-1 h-14"
               onClick={() => api?.scrollNext()}
             >
               Próximo <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
           )}
        </div>
      </main>
    </div>
  );
}
