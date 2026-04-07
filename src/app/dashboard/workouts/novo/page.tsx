'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, Save, Trash2, GripVertical, Plus, CalendarDays } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  videoUrl?: string;
}

interface WorkoutDay {
  id: string;
  name: string;
  exercises: Exercise[];
}

export default function WorkoutBuilder() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('Ficha criada no construtor v2.');
  
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([
    { 
      id: 'day-1', 
      name: 'Treino A', 
      exercises: [{ id: 'ex-1', name: 'Supino Reto', sets: 4, reps: '10' }] 
    }
  ]);
  
  const [activeDayId, setActiveDayId] = useState('day-1');

  const exercisesRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'exercises'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const { data: libraryExercises } = useCollection(exercisesRef);

  const addDay = () => {
    const nextLetter = String.fromCharCode(65 + workoutDays.length);
    const newId = `day-${Date.now()}`;
    setWorkoutDays([
      ...workoutDays, 
      { id: newId, name: `Treino ${nextLetter}`, exercises: [] }
    ]);
    setActiveDayId(newId);
  };

  const removeDay = (id: string) => {
    if (workoutDays.length === 1) return;
    const filtered = workoutDays.filter(d => d.id !== id);
    // Re-label days to keep A, B, C order
    const reLabeled = filtered.map((day, idx) => ({
      ...day,
      name: `Treino ${String.fromCharCode(65 + idx)}`
    }));
    setWorkoutDays(reLabeled);
    if (activeDayId === id) {
      setActiveDayId(reLabeled[Math.min(activeDayId === id ? 0 : 0, reLabeled.length - 1)].id);
    }
  };

  const updateDayName = (id: string, name: string) => {
    setWorkoutDays(workoutDays.map(d => d.id === id ? { ...d, name } : d));
  };

  const addExercise = (dayId: string) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: [...day.exercises, { id: `ex-${Date.now()}`, name: '', sets: 3, reps: '12', videoUrl: '' }]
        };
      }
      return day;
    }));
  };

  const removeExercise = (dayId: string, exId: string) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: day.exercises.filter(ex => ex.id !== exId)
        };
      }
      return day;
    }));
  };

  const updateExercise = (dayId: string, exId: string, field: keyof Exercise, value: string | number) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: day.exercises.map(ex => ex.id === exId ? { ...ex, [field]: value } : ex)
        };
      }
      return day;
    }));
  };

  const handleSave = async () => {
    if (!workoutTitle.trim()) {
      toast({ title: 'Erro', description: 'Dê um nome para a ficha.', variant: 'destructive' });
      return;
    }
    
    if (!user || !firestore) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const batch = writeBatch(firestore);
      
      // 1. Create the training plan document
      const planRef = doc(collection(firestore, 'trainingPlans'));
      const planData = {
        id: planRef.id,
        name: workoutTitle,
        description: workoutDescription,
        createdByUserId: user.uid,
        assignedToAthleteIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        daysCount: workoutDays.length
      };

      batch.set(planRef, planData);

      // 2. Add workout days to subcollection
      workoutDays.forEach((day, index) => {
        const dayRef = doc(collection(firestore, `trainingPlans/${planRef.id}/workoutDays`));
        const dayData = {
          id: dayRef.id,
          dayOrder: index + 1,
          name: day.name,
          trainingPlanOwnerId: user.uid,
          trainingPlanAssignedToAthleteIds: [],
          exercises: day.exercises.map(ex => ({
            exerciseName: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            videoUrl: ex.videoUrl || '',
            isCompleted: false
          }))
        };
        batch.set(dayRef, dayData);
      });

      await batch.commit();

      toast({ title: 'Sucesso!', description: 'Ficha completa salva na biblioteca.' });
      setTimeout(() => router.push('/dashboard/workouts'), 1500);
    } catch (e: any) {
      console.error('Save error:', e);
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const activeDay = workoutDays.find(d => d.id === activeDayId) || workoutDays[0];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background/50 p-6 rounded-2xl border border-primary/10 backdrop-blur-sm sticky top-4 z-20">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Novo Plano de Treino</h1>
          <p className="text-muted-foreground">Configure os dias e exercícios da ficha.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={handleSave} className="flex-1 md:flex-none" size="lg" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Ficha Completa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Details Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/50 overflow-hidden border-primary/5">
            <CardHeader className="bg-primary/5">
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Plano</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Ficha Hipertrofia Avançada" 
                  value={workoutTitle}
                  onChange={e => setWorkoutTitle(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Input 
                  id="description" 
                  placeholder="Ex: Foco em membros superiores" 
                  value={workoutDescription}
                  onChange={e => setWorkoutDescription(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 overflow-hidden border-primary/5">
            <CardHeader className="bg-primary/5 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base">Estrutura de Dias</CardTitle>
              <Button variant="ghost" size="sm" onClick={addDay} className="h-8 px-2 hover:bg-primary/10 text-primary">
                <Plus className="w-4 h-4 mr-1" /> Novo Dia
              </Button>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border/30">
                 {workoutDays.map((day, idx) => (
                   <div 
                    key={day.id} 
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${activeDayId === day.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/50'}`}
                    onClick={() => setActiveDayId(day.id)}
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-xs font-bold shadow-sm">
                         {String.fromCharCode(65 + idx)}
                       </div>
                       <div>
                         <p className="text-sm font-medium">{day.name}</p>
                         <p className="text-xs text-muted-foreground">{day.exercises.length} exercícios</p>
                       </div>
                     </div>
                     {workoutDays.length > 1 && (
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDay(day.id);
                        }}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     )}
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Exercises Column */}
        <div className="lg:col-span-2">
          <Tabs value={activeDayId} onValueChange={setActiveDayId} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Editando: <span className="text-primary">{activeDay.name}</span></h2>
              </div>
              <Button onClick={() => addExercise(activeDayId)} variant="outline" size="sm" className="bg-primary/5 border-primary/20 hover:bg-primary/10">
                <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Exercício
              </Button>
            </div>

            {workoutDays.map(day => (
              <TabsContent key={day.id} value={day.id} className="mt-0 space-y-4">
                {day.exercises.length > 0 ? (
                  day.exercises.map((ex, exIdx) => (
                    <ExerciseCard 
                      key={ex.id}
                      ex={ex}
                      exIdx={exIdx}
                      dayId={day.id}
                      updateExercise={updateExercise}
                      removeExercise={removeExercise}
                      libraryExercises={libraryExercises || []}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary/10 rounded-2xl bg-primary/5 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nenhum exercício neste dia.</p>
                    <Button onClick={() => addExercise(day.id)} variant="link" className="text-primary mt-2">
                      Adicionar o primeiro exercício
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
}

const Dumbbell = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m6.5 6.5 11 11" /><path d="m10 10 5.5 5.5" /><path d="m3 21 8-8" /><path d="m9 9 2 2" /><path d="m13 13 2 2" /><path d="m11 20 4-4" /><path d="m15 20 4-4" /><path d="m20 15-4 4" /><path d="m20 11-4 4" /><path d="m14 7 4 4" /><path d="m8 7 4 4" /><path d="m10 5 4 4" /><path d="m8 3 4 4" /><path d="m14 3 4 4" /><path d="M3 13 7 9" /><path d="m3 17 4-4" /><path d="m3 9 4 4" />
  </svg>
);

interface ExerciseCardProps {
  ex: Exercise;
  exIdx: number;
  dayId: string;
  updateExercise: (dayId: string, exId: string, field: keyof Exercise, value: string | number) => void;
  removeExercise: (dayId: string, exId: string) => void;
  libraryExercises: any[];
}

function ExerciseCard({ ex, exIdx, dayId, updateExercise, removeExercise, libraryExercises }: ExerciseCardProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  return (
    <Card className="bg-card/40 border-primary/5 hover:border-primary/20 transition-all group">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0 shrink-0 bg-background">
            {exIdx + 1}
          </Badge>
          
          <div className="w-full sm:flex-1 space-y-2">
            <Label className="text-xs text-muted-foreground">Nome do Exercício</Label>
             <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground/50 z-10" />
               <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                 <PopoverTrigger asChild>
                   <Input 
                     placeholder="Ex: Supino Reto com Barra" 
                     className="pl-9 bg-background/50 border-none focus-visible:ring-primary/30"
                     value={ex.name}
                     onChange={(e) => {
                        updateExercise(dayId, ex.id, 'name', e.target.value);
                        if (!isPopoverOpen) setIsPopoverOpen(true);
                     }}
                     onFocus={() => setIsPopoverOpen(true)}
                   />
                 </PopoverTrigger>
                 <PopoverContent className="p-0 w-80 shadow-2xl border-primary/10" align="start">
                   <ScrollArea className="h-64">
                     <div className="p-2 space-y-1">
                       {libraryExercises
                         ?.filter(libEx => !ex.name || libEx.name.toLowerCase().includes(ex.name.toLowerCase()))
                         .map(libEx => (
                           <Button
                             key={libEx.id}
                             variant="ghost"
                             className="w-full justify-start font-normal text-sm h-auto py-2 px-3 hover:bg-primary/10 hover:text-primary transition-colors flex flex-col items-start gap-1"
                             onClick={() => {
                                updateExercise(dayId, ex.id, 'name', libEx.name);
                                if (libEx.videoUrl) {
                                  updateExercise(dayId, ex.id, 'videoUrl', libEx.videoUrl);
                                }
                                setIsPopoverOpen(false);
                             }}
                           >
                             <span className="font-medium">{libEx.name}</span>
                             {libEx.muscleGroup && (
                               <span className="text-[10px] opacity-60 uppercase tracking-wider">{libEx.muscleGroup}</span>
                             )}
                           </Button>
                         ))}
                       {(libraryExercises?.filter(libEx => !ex.name || libEx.name.toLowerCase().includes(ex.name.toLowerCase())).length === 0) && (
                         <p className="text-xs text-center p-4 text-muted-foreground">Nenhum exercício sugerido</p>
                       )}
                     </div>
                   </ScrollArea>
                 </PopoverContent>
               </Popover>
             </div>
          </div>

          <div className="flex gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:w-20 space-y-2">
              <Label className="text-xs text-muted-foreground">Séries</Label>
              <Input 
                type="number" 
                value={ex.sets}
                className="bg-background/50 border-none"
                onChange={(e) => updateExercise(dayId, ex.id, 'sets', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex-1 sm:w-32 space-y-2">
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input 
                value={ex.reps}
                className="bg-background/50 border-none"
                onChange={(e) => updateExercise(dayId, ex.id, 'reps', e.target.value)}
              />
            </div>
            <div className="flex-1 sm:w-48 space-y-2">
              <Label className="text-xs text-muted-foreground">Vídeo (Link)</Label>
              <Input 
                placeholder="Link Youtube/Drive"
                value={ex.videoUrl || ''}
                className="bg-background/50 border-none"
                onChange={(e) => updateExercise(dayId, ex.id, 'videoUrl', e.target.value)}
              />
            </div>
            <div className="pt-6 sm:pt-6">
              <Button 
                variant="destructive" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeExercise(dayId, ex.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
