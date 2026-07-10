'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ChevronLeft, ArrowRight, Play, Timer, Trophy, Dumbbell, Loader2, AlertTriangle, RotateCcw, Pause } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ExerciseVideo } from '@/components/exercise-video';
import Image from 'next/image';

interface ExerciseCountdownTimerProps {
  durationSeconds: number;
  onTimerComplete: () => void;
}

function ExerciseCountdownTimer({ durationSeconds, onTimerComplete }: ExerciseCountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeRemaining(durationSeconds);
    setIsRunning(false);
  }, [durationSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(t => {
          if (t <= 1) {
            setIsRunning(false);
            onTimerComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, onTimerComplete]);

  const percentage = (timeRemaining / durationSeconds) * 100;

  return (
    <div className="bg-muted/40 border border-primary/10 rounded-xl p-4 flex flex-col items-center space-y-3">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cronômetro de Execução</span>
        <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          Alvo: {durationSeconds}s
        </span>
      </div>

      <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden border border-primary/5">
        <div 
          className="absolute left-0 top-0 h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center gap-4 w-full">
        <div className="text-3xl font-black font-mono text-foreground flex-1 text-left">
          {timeRemaining} <span className="text-xs text-muted-foreground font-normal">segundos</span>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setTimeRemaining(durationSeconds)}
            className="h-9 w-9 p-0 rounded-lg"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </Button>

          <Button 
            size="sm" 
            variant={isRunning ? "destructive" : "default"}
            onClick={() => setIsRunning(!isRunning)}
            className="h-9 px-4 rounded-lg flex items-center gap-1.5 font-bold"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Iniciar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutPlayer({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { id: planId } = use(params);

  const activePhaseName = searchParams.get('phase') || 'A1';

  const [current, setCurrent] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
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

  const filteredDays = useMemo(() => {
    if (!days) return [];
    if (!plan?.phases || plan.phases.length === 0) return days;
    return days.filter((d: any) => {
      const pName = d.phaseName || 'A1';
      return pName.toLowerCase() === activePhaseName.toLowerCase();
    });
  }, [days, plan, activePhaseName]);



  // Fetch student adaptations
  const adaptationsRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'userProfiles', user.uid, 'adaptations'),
      where('planId', '==', planId)
    );
  }, [firestore, user?.uid, planId]);

  const { data: adaptationsRaw } = useCollection<any>(adaptationsRef);

  // Fetch student limitations
  const limitationsRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'userProfiles', user.uid, 'limitations'));
  }, [firestore, user?.uid]);

  const { data: limitations } = useCollection<any>(limitationsRef);

  const activeDay = filteredDays?.find(d => d.id === selectedDayId);

  // Merge athlete-specific adaptations & limitations warnings
  const exercises = useMemo(() => {
    if (!activeDay || !activeDay.exercises) return [];

    // Map adaptations keyed by `${dayId}_${exerciseIndex}`
    const adaptationsMap: Record<string, any> = {};
    if (adaptationsRaw) {
      adaptationsRaw.forEach((ad: any) => {
        adaptationsMap[`${activeDay.id}_${ad.exerciseIndex}`] = ad;
      });
    }

    // Filter active limitations
    const activeLimitations = limitations?.filter((lim: any) => {
      if (lim.type === 'temporary') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recDate = new Date(lim.recoveryDate);
        recDate.setHours(23, 59, 59, 999);
        return recDate >= today;
      }
      return true;
    }) || [];

    const getLimitation = (exerciseName: string) => {
      const lowerName = exerciseName.toLowerCase();
      return activeLimitations.find((lim: any) => {
        if (lowerName.includes(lim.description.toLowerCase())) return true;
        return lim.affectedKeywords?.some((k: string) => lowerName.includes(k));
      });
    };

    return activeDay.exercises
      .map((ex: any, idx: number) => {
        const ad = adaptationsMap[`${activeDay.id}_${idx}`];
        if (ad?.isDeleted) return null; // filtered out

        const finalName = ad?.substitutedExerciseName || ex.exerciseName || ex.name;
        const finalSets = ad?.sets ?? ex.sets;
        const finalReps = ad?.reps ?? ex.reps;
        const finalVideoUrl = ad?.hasOwnProperty('substitutedVideoUrl') ? ad.substitutedVideoUrl : ex.videoUrl;
        const limitInfo = getLimitation(finalName);

        return {
          ...ex,
          id: ex.id || `exercise-${idx}`,
          name: finalName,
          sets: finalSets,
          reps: finalReps,
          videoUrl: finalVideoUrl,
          notes: ad?.notes || ex.notes || '',
          limitation: limitInfo ? limitInfo.description : null,
        };
      })
      .filter(Boolean) as any[];
  }, [activeDay, adaptationsRaw, limitations]);

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
               <div className="w-full h-full relative">
                 <Image 
                   src="/images/video-placeholder.png" 
                   alt="Vídeo em breve" 
                   fill 
                   className="object-cover opacity-80"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white/50" />
                 </div>
               </div>
             )}
             <span className="absolute top-3 right-3 bg-black/60 text-white px-2.5 py-1 text-[10px] rounded-full font-bold tracking-wider uppercase backdrop-blur-md border border-white/10 z-20 shadow-lg">
               {ex.target || 'Exercício'}
             </span>
          </div>

          <CardHeader className="text-center pt-6">
            <CardTitle className="text-2xl font-headline font-bold leading-tight">{ex.name}</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!ex.isTimeBased ? (
              <div className="flex justify-center gap-4 text-center bg-background rounded-lg py-4 border border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Séries</p>
                  <p className="text-2xl font-bold font-mono">{setsCount}</p>
                </div>
                <div className="w-px bg-border"></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Rep. alvo</p>
                  <p className="text-2xl font-bold font-mono text-primary">{ex.reps}</p>
                </div>
                <div className="w-px bg-border"></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Carga</p>
                  <div className="flex items-center justify-center mt-1">
                    <LoadInput 
                      initialValue={ex.carga || ''} 
                      onSave={(newLoad) => handleUpdateLoad(index, newLoad)} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center gap-4 text-center bg-background rounded-lg py-4 border border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Séries</p>
                  <p className="text-2xl font-bold font-mono">{setsCount}</p>
                </div>
                <div className="w-px bg-border"></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Tempo Alvo</p>
                  <p className="text-2xl font-bold font-mono text-primary">{ex.durationSeconds || 30}s</p>
                </div>
              </div>
            )}

            {ex.isTimeBased && (
              <ExerciseCountdownTimer 
                durationSeconds={ex.durationSeconds || 30}
                onTimerComplete={() => {
                  handleCompleteSet(ex.id, setsCount, activeDay?.restSeconds || 60);
                }}
              />
            )}

            {(ex.notes || ex.description) && (
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-sm text-foreground/90 font-medium text-left">
                <span className="font-bold text-xs uppercase text-primary block tracking-wider mb-0.5">Orientação Especial / Descrição:</span>
                {ex.notes || ex.description}
              </div>
            )}

            {ex.limitation && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm text-red-500 font-medium flex items-start gap-2 animate-pulse text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-xs uppercase block tracking-wider">Alerta de Saúde / Limitação:</span>
                  <span>Este exercício afeta uma restrição cadastrada: <strong>{ex.limitation}</strong>. Evite movimentos que causem dor.</span>
                </div>
              </div>
            )}

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

  const handleUpdateLoad = async (exerciseIndex: number, newLoad: string) => {
    if (!firestore || !planId || !selectedDayId || !activeDay || !activeDay.exercises) return;

    try {
      const updatedExercises = [...activeDay.exercises];
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        carga: newLoad
      };

      const dayRef = doc(firestore, 'trainingPlans', planId, 'workoutDays', selectedDayId);
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(dayRef, { exercises: updatedExercises });
    } catch (error) {
      console.error('Error updating load in firestore:', error);
    }
  };

  const handleFinishWorkout = async () => {
    setIsFinished(true);
    if (firestore && user?.uid && planId) {
      try {
        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const sessionsRef = collection(firestore, 'userProfiles', user.uid, 'workoutSessions');
        await addDoc(sessionsRef, {
          planId: planId,
          dayId: selectedDayId || 'day-1',
          dayName: activeDay?.name || 'Treino A',
          phaseName: activeDay?.phaseName || 'A1',
          completedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error saving workout session log:', error);
      }
    }
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
            {filteredDays?.map((day: any) => (
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

function LoadInput({ initialValue, onSave }: { initialValue: string; onSave: (val: string) => void }) {
  const [val, setVal] = useState(initialValue || '');

  useEffect(() => {
    setVal(initialValue || '');
  }, [initialValue]);

  return (
    <input
      type="text"
      value={val}
      placeholder="Ex: 20kg"
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== initialValue) {
          onSave(val);
        }
      }}
      className="w-20 text-center font-bold font-mono text-primary bg-background border border-border/60 rounded px-1 py-0.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
    />
  );
}
