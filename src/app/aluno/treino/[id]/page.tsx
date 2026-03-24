'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ChevronLeft, ArrowRight, Play, Timer, Trophy } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";

// Mock Data
const workout = {
  id: 'wk-123',
  title: 'Série A - Peito e Tríceps',
  exercises: [
    { id: '1', name: 'Supino Reto com Barra', sets: 4, reps: '10-12', rest: 60, target: 'Peito' },
    { id: '2', name: 'Crucifixo Inclinado com Halteres', sets: 3, reps: '12', rest: 45, target: 'Peito' },
    { id: '3', name: 'Crossover Polia Alta', sets: 3, reps: '15', rest: 45, target: 'Peito' },
    { id: '4', name: 'Tríceps Corda', sets: 4, reps: '12-15', rest: 45, target: 'Tríceps' },
    { id: '5', name: 'Tríceps Testa com Halteres', sets: 3, reps: '10', rest: 60, target: 'Tríceps' },
  ]
};

export default function WorkoutPlayer({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

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
    if (currentSets + 1 >= maxSets && current < workout.exercises.length - 1) {
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

  const progress = ((current) / (workout.exercises.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="flex items-center p-4 border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push('/aluno')} className="mr-2">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold truncate leading-none">{workout.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">Exercício {current + 1} de {workout.exercises.length}</p>
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
            {workout.exercises.map((ex, index) => {
              const setsDone = completedSets[ex.id] || 0;
              const isExerciseComplete = setsDone >= ex.sets;

              return (
                <CarouselItem key={ex.id}>
                  <Card className={`border-2 transition-colors duration-300 shadow-xl ${isExerciseComplete ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
                    {/* Placeholder Onde ficaria o GIF de execução */}
                    <div className="w-full h-56 bg-secondary flex items-center justify-center rounded-t-lg relative overflow-hidden">
                       <Play className="w-12 h-12 text-muted-foreground/30" />
                       <span className="absolute bottom-3 right-3 bg-background/80 px-2 py-1 text-xs rounded font-medium backdrop-blur">
                         {ex.target}
                       </span>
                    </div>

                    <CardHeader className="text-center pt-6">
                      <CardTitle className="text-2xl font-headline font-bold leading-tight">{ex.name}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="flex justify-center gap-8 text-center bg-background rounded-lg py-4 border border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Séries</p>
                          <p className="text-2xl font-bold font-mono">{ex.sets}</p>
                        </div>
                        <div className="w-px bg-border"></div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Rep. alvo</p>
                          <p className="text-2xl font-bold font-mono text-primary">{ex.reps}</p>
                        </div>
                      </div>

                      {/* Controle de Séries */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium pt-2 text-center text-muted-foreground">Progresso do Exercício</p>
                        {Array.from({ length: ex.sets }).map((_, i) => (
                          <div 
                            key={i} 
                            onClick={() => i === setsDone && handleCompleteSet(ex.id, ex.sets, ex.rest)}
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
                              <div className="w-6 h-6 rounded-full border-2 border-primary/50 flex items-center justify-center">
                                {/* Pode vir a ser um botão de concluir */}
                              </div>
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
            })}
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
           
           {current === workout.exercises.length - 1 ? (
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
