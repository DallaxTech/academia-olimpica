'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, Save, Trash2, Plus, CalendarDays, RotateCcw, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from "@/components/ui/tabs";
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

const MALE_TEMPLATE_DAYS: WorkoutDay[] = [
  { 
    id: 'day-1', 
    name: 'Treino A (Peito/Tríceps/Ombros)', 
    exercises: [
      { id: 'm-ex-1', name: 'Supino Reto Barra', sets: 4, reps: '10 a 12' },
      { id: 'm-ex-2', name: 'Supino Inclinado com Halteres', sets: 3, reps: '10' },
      { id: 'm-ex-3', name: 'Cross Over Polia Média', sets: 3, reps: '12' },
      { id: 'm-ex-4', name: 'Desenvolvimento de Ombros Halteres', sets: 4, reps: '10' },
      { id: 'm-ex-5', name: 'Elevação Lateral Halteres', sets: 3, reps: '12' },
      { id: 'm-ex-6', name: 'Tríceps Pulley Barra', sets: 4, reps: '12' },
      { id: 'm-ex-7', name: 'Tríceps Testa com Halteres', sets: 3, reps: '10' }
    ]
  },
  { 
    id: 'day-2', 
    name: 'Treino B (Costas/Bíceps/Trapézio)', 
    exercises: [
      { id: 'm-ex-8', name: 'Puxada Alta Pronada', sets: 4, reps: '10 a 12' },
      { id: 'm-ex-9', name: 'Remada Baixa Triângulo', sets: 4, reps: '10' },
      { id: 'm-ex-10', name: 'Pull Down com Corda', sets: 3, reps: '12' },
      { id: 'm-ex-11', name: 'Rosca Direta Barra W', sets: 4, reps: '10' },
      { id: 'm-ex-12', name: 'Rosca Martelo Alternada', sets: 3, reps: '12' },
      { id: 'm-ex-13', name: 'Encolhimento com Halteres', sets: 4, reps: '12' }
    ]
  },
  { 
    id: 'day-3', 
    name: 'Treino C (Membros Inferiores)', 
    exercises: [
      { id: 'm-ex-14', name: 'Agachamento Livre com Barra', sets: 4, reps: '10' },
      { id: 'm-ex-15', name: 'Leg Press 45', sets: 4, reps: '12' },
      { id: 'm-ex-16', name: 'Cadeira Extensora', sets: 3, reps: '12 a 15' },
      { id: 'm-ex-17', name: 'Mesa Flexora', sets: 4, reps: '12' },
      { id: 'm-ex-18', name: 'Cadeira Abdutora', sets: 3, reps: '15' },
      { id: 'm-ex-19', name: 'Gêmeos Sentado (Panturrilha)', sets: 4, reps: '15' }
    ]
  }
];

const FEMALE_TEMPLATE_DAYS: WorkoutDay[] = [
  { 
    id: 'day-1', 
    name: 'Treino A (Coxas e Glúteos)', 
    exercises: [
      { id: 'f-ex-1', name: 'Agachamento Búlgaro', sets: 3, reps: '10' },
      { id: 'f-ex-2', name: 'Elevação Pélvica Barra', sets: 4, reps: '12' },
      { id: 'f-ex-3', name: 'Leg Press 45', sets: 4, reps: '10' },
      { id: 'f-ex-4', name: 'Cadeira Extensora', sets: 3, reps: '12 a 15' },
      { id: 'f-ex-5', name: 'Cadeira Adutora', sets: 3, reps: '15' },
      { id: 'f-ex-6', name: 'Gêmeos em Pé (Panturrilha)', sets: 4, reps: '15' }
    ]
  },
  { 
    id: 'day-2', 
    name: 'Treino B (Superiores e Core)', 
    exercises: [
      { id: 'f-ex-7', name: 'Puxada Alta Pulley', sets: 3, reps: '12' },
      { id: 'f-ex-8', name: 'Remada Baixa Polia', sets: 3, reps: '12' },
      { id: 'f-ex-9', name: 'Desenvolvimento Ombros Halteres', sets: 3, reps: '10' },
      { id: 'f-ex-10', name: 'Elevação Lateral Halteres', sets: 3, reps: '12' },
      { id: 'f-ex-11', name: 'Tríceps Pulley Corda', sets: 3, reps: '12' },
      { id: 'f-ex-12', name: 'Abdominal Supra no Solo', sets: 4, reps: '20' }
    ]
  },
  { 
    id: 'day-3', 
    name: 'Treino C (Posteriores e Glúteos)', 
    exercises: [
      { id: 'f-ex-13', name: 'Levantamento Terra Stiff', sets: 4, reps: '10' },
      { id: 'f-ex-14', name: 'Cadeira Flexora', sets: 4, reps: '12' },
      { id: 'f-ex-15', name: 'Glúteo Coice no Cabo', sets: 3, reps: '12' },
      { id: 'f-ex-16', name: 'Passada Avanço Halteres', sets: 3, reps: '12 passos' },
      { id: 'f-ex-17', name: 'Cadeira Abdutora', sets: 4, reps: '15' }
    ]
  }
];

export default function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const [isSaving, setIsSaving] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'custom' | null>(null);
  
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [activeDayId, setActiveDayId] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [initialDayIds, setInitialDayIds] = useState<string[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Firestore Queries
  const planRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'trainingPlans', id);
  }, [firestore, id]);

  const { data: plan, isLoading: isPlanLoading } = useDoc<any>(planRef);

  const daysRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, `trainingPlans/${id}/workoutDays`), orderBy('dayOrder', 'asc'));
  }, [firestore, id]);

  const { data: days, isLoading: isDaysLoading } = useCollection<any>(daysRef);

  const exercisesRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'exercises'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const { data: libraryExercises } = useCollection(exercisesRef);

  // Load existing data into state
  useEffect(() => {
    if (plan && days && !dataLoaded) {
      setWorkoutTitle(plan.name || '');
      setWorkoutDescription(plan.description || '');
      setSelectedGender(plan.gender || 'custom');
      
      const loadedDays = days.map((day: any) => ({
        id: day.id,
        name: day.name || '',
        exercises: (day.exercises || []).map((ex: any, idx: number) => ({
          id: ex.id || `ex-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          name: ex.exerciseName || '',
          sets: ex.sets || 3,
          reps: ex.reps || '10',
          videoUrl: ex.videoUrl || ''
        }))
      }));

      setWorkoutDays(loadedDays);
      setInitialDayIds(days.map((d: any) => d.id));
      if (loadedDays.length > 0) {
        setActiveDayId(loadedDays[0].id);
      }
      setDataLoaded(true);
    }
  }, [plan, days, dataLoaded]);

  const applyTemplate = (gender: 'male' | 'female' | 'custom') => {
    setSelectedGender(gender);
    if (gender === 'male') {
      setWorkoutTitle('Ficha de Treino ABC - Masculino');
      setWorkoutDescription('Ficha padrão sugerida para o perfil masculino (A: Peito/Tríceps/Ombros, B: Costas/Bíceps/Trapézio, C: Pernas).');
      setWorkoutDays(MALE_TEMPLATE_DAYS);
      setActiveDayId(MALE_TEMPLATE_DAYS[0].id);
    } else if (gender === 'female') {
      setWorkoutTitle('Ficha de Treino ABC - Feminino');
      setWorkoutDescription('Ficha padrão sugerida para o perfil feminino (A: Quadríceps/Glúteos, B: Superiores/Core, C: Posterior/Glúteos).');
      setWorkoutDays(FEMALE_TEMPLATE_DAYS);
      setActiveDayId(FEMALE_TEMPLATE_DAYS[0].id);
    } else {
      setWorkoutTitle('');
      setWorkoutDescription('Ficha personalizada.');
      setWorkoutDays([
        { 
          id: 'day-1', 
          name: 'Treino A', 
          exercises: [{ id: 'ex-1', name: '', sets: 3, reps: '10' }] 
        }
      ]);
      setActiveDayId('day-1');
    }
    setShowTemplateSelector(false);
  };

  const addDay = () => {
    const nextLetter = String.fromCharCode(65 + workoutDays.length);
    const newId = `day-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setWorkoutDays([
      ...workoutDays, 
      { id: newId, name: `Treino ${nextLetter}`, exercises: [] }
    ]);
    setActiveDayId(newId);
  };

  const removeDay = (dayId: string) => {
    if (workoutDays.length === 1) return;
    const filtered = workoutDays.filter(d => d.id !== dayId);
    const reLabeled = filtered.map((day, idx) => ({
      ...day,
      name: `Treino ${String.fromCharCode(65 + idx)}`
    }));
    setWorkoutDays(reLabeled);
    if (activeDayId === dayId) {
      setActiveDayId(reLabeled[0].id);
    }
  };

  const addExercise = (dayId: string) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: [...day.exercises, { id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, name: '', sets: 3, reps: '12', videoUrl: '' }]
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

    setIsSaving(true);
    try {
      const batch = writeBatch(firestore);
      
      // 1. Update core training plan document
      const currentPlanRef = doc(firestore, 'trainingPlans', id);
      batch.update(currentPlanRef, {
        name: workoutTitle,
        description: workoutDescription,
        daysCount: workoutDays.length,
        gender: selectedGender || 'custom',
        updatedAt: serverTimestamp(),
      });

      // 2. Identify removed days to delete them from subcollection
      const currentDayIds = workoutDays.map(d => d.id);
      const daysToDelete = initialDayIds.filter(idToDelete => !currentDayIds.includes(idToDelete));
      
      daysToDelete.forEach(dayId => {
        const docRef = doc(firestore, 'trainingPlans', id, 'workoutDays', dayId);
        batch.delete(docRef);
      });

      // 3. Set or update remaining workoutDays
      workoutDays.forEach((day, index) => {
        let dayRef;
        if (initialDayIds.includes(day.id)) {
          dayRef = doc(firestore, 'trainingPlans', id, 'workoutDays', day.id);
        } else {
          // If it's a new day added in edit mode
          dayRef = doc(collection(firestore, 'trainingPlans', id, 'workoutDays'));
        }

        const dayData = {
          id: dayRef.id,
          dayOrder: index + 1,
          name: day.name,
          trainingPlanOwnerId: user.uid,
          trainingPlanAssignedToAthleteIds: plan?.assignedToAthleteIds || [],
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

      toast({ title: 'Sucesso!', description: 'Treino atualizado com sucesso.' });
      setTimeout(() => router.push(`/dashboard/workouts/${id}`), 1000);
    } catch (e: any) {
      console.error('Update error:', e);
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isPlanLoading || isDaysLoading || !dataLoaded;

  if (isLoading) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Carregando ficha de treino para edição...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col justify-center items-center space-y-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">Plano de Treino não encontrado</h2>
          <p className="text-muted-foreground mb-4">O plano de treino que você está tentando editar não existe ou foi removido.</p>
          <Button onClick={() => router.push('/dashboard/workouts')}>Voltar para a biblioteca</Button>
        </Card>
      </div>
    );
  }

  const activeDay = workoutDays.find(d => d.id === activeDayId) || workoutDays[0];

  if (showTemplateSelector) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-8 min-h-[80vh] flex flex-col justify-center items-center space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-headline font-bold text-primary">Alterar Modelo de Ficha</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Aviso: Ao selecionar um novo modelo, todos os exercícios e dias atuais configurados para esta ficha serão substituídos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-4">
          {/* Card Masculino */}
          <button 
            type="button"
            onClick={() => applyTemplate('male')}
            className={cn(
              "flex flex-col items-center p-8 rounded-2xl border text-center transition-all duration-300 group",
              "bg-card/40 border-primary/10 hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_30px_rgba(132,207,114,0.15)]"
            )}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-primary/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8a4 4 0 11-8 0 4 4 0 018 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold font-headline mb-2 group-hover:text-primary">Homem (Masculino)</h2>
            <p className="text-sm text-muted-foreground mb-4">Substituir pelos exercícios padrão de hipertrofia masculina.</p>
          </button>

          {/* Card Feminino */}
          <button 
            type="button"
            onClick={() => applyTemplate('female')}
            className={cn(
              "flex flex-col items-center p-8 rounded-2xl border text-center transition-all duration-300 group",
              "bg-card/40 border-primary/10 hover:border-accent hover:bg-accent/5 hover:shadow-[0_0_30px_rgba(23,208,240,0.15)]"
            )}
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-accent/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a5 5 0 100-10 5 5 0 000 10zM12 11v9M9 16h6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold font-headline mb-2 group-hover:text-accent">Mulher (Feminino)</h2>
            <p className="text-sm text-muted-foreground mb-4">Substituir pelos exercícios padrão de definição feminina.</p>
          </button>

          {/* Card Em Branco */}
          <button 
            type="button"
            onClick={() => applyTemplate('custom')}
            className={cn(
              "flex flex-col items-center p-8 rounded-2xl border text-center transition-all duration-300 group",
              "bg-card/40 border-primary/10 hover:border-muted-foreground hover:bg-muted/5 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            )}
          >
            <div className="w-16 h-16 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-muted/20 group-hover:text-foreground transition-all duration-300 shadow-sm border border-border/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold font-headline mb-2 group-hover:text-foreground">Começar do Zero</h2>
            <p className="text-sm text-muted-foreground mb-4">Substituir por uma ficha limpa contendo apenas 1 dia em branco.</p>
          </button>
        </div>

        <div className="pt-4">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setShowTemplateSelector(false)}>
            Cancelar e manter ficha atual
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background/50 p-6 rounded-2xl border border-primary/10 backdrop-blur-sm sticky top-4 z-20">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Editar Plano de Treino</h1>
          <p className="text-muted-foreground">Altere a estrutura de dias e exercícios da ficha.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={handleSave} className="flex-1 md:flex-none" size="lg" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
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
              
              <div className="pt-4 border-t border-border/30 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Perfil atual: <strong>{selectedGender === 'male' ? 'Masculino' : selectedGender === 'female' ? 'Feminino' : 'Personalizado'}</strong></span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs h-9 text-primary border-primary/20 hover:bg-primary/10 mt-1"
                  onClick={() => setShowTemplateSelector(true)}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Trocar Modelo/Limpar
                </Button>
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
                        className="h-8 w-8 text-destructive opacity-80 hover:opacity-100 transition-opacity"
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
          {activeDay ? (
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
                      <DumbbellIcon className="w-12 h-12 mb-4 opacity-20" />
                      <p>Nenhum exercício neste dia.</p>
                      <Button onClick={() => addExercise(day.id)} variant="link" className="text-primary mt-2">
                        Adicionar o primeiro exercício
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-xl bg-background/20 text-muted-foreground">
              Selecione ou adicione um dia de treino na barra lateral.
            </div>
          )}
        </div>
      </div>
      
      <Toaster />
    </div>
  );
}

const DumbbellIcon = ({ className }: { className?: string }) => (
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
  const { toast } = useToast();
  
  return (
    <Card className="bg-card/40 border-primary/5 hover:border-primary/20 transition-all group shadow-sm">
      <CardContent className="p-4 md:p-5 space-y-4">
        {/* Linha Superior (Cabeçalho): Número da Série + Nome do Exercício com Busca */}
        <div className="flex items-center gap-3 w-full pb-3 border-b border-border/30">
          <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0 shrink-0 bg-primary/10 text-primary border-primary/20 text-sm font-semibold">
            {exIdx + 1}
          </Badge>
          
          <div className="flex-1 min-w-0">
             <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground/50 z-10 pointer-events-none" />
               <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Input 
                      placeholder="Selecionar ou digitar exercício..." 
                      className="pl-9 bg-background/50 border-none focus-visible:ring-primary/30 w-full text-base font-semibold placeholder:font-normal cursor-pointer"
                      value={ex.name}
                      readOnly
                    />
                  </PopoverTrigger>
                  <PopoverContent 
                    className="p-0 w-80 shadow-2xl border-primary/10 bg-popover overflow-hidden" 
                    align="start"
                  >
                    {/* Caixa de pesquisa dedicada no topo do menu */}
                    <div className="p-3 border-b border-border/30 flex items-center gap-2 bg-muted/20">
                      <Search className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      <Input 
                        placeholder="Pesquise ou digite o exercício..."
                        className="h-8 text-sm bg-transparent border-none focus-visible:ring-0 p-0 placeholder:font-normal font-medium focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none"
                        value={ex.name}
                        onChange={(e) => {
                          updateExercise(dayId, ex.id, 'name', e.target.value);
                        }}
                        autoFocus
                      />
                    </div>

                    <ScrollArea className="h-60">
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
                                 toast({
                                   title: "Exercício Adicionado",
                                   description: `${libEx.name} foi configurado nesta série.`,
                                   duration: 2000,
                                 });
                               }}
                            >
                              <span className="font-medium">{libEx.name}</span>
                              {libEx.muscleGroup && (
                                <span className="text-[10px] opacity-60 uppercase tracking-wider">{libEx.muscleGroup}</span>
                              )}
                            </Button>
                          ))}
                        {(libraryExercises?.filter(libEx => !ex.name || libEx.name.toLowerCase().includes(ex.name.toLowerCase())).length === 0) && (
                          <div className="p-2">
                            <Button
                              variant="outline"
                              className="w-full justify-start font-normal text-xs py-1 px-3 text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => {
                                setIsPopoverOpen(false);
                              }}
                            >
                              Usar valor digitado: "{ex.name}"
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
               </Popover>
             </div>
          </div>
        </div>

        {/* Linha Inferior: Detalhes do Treino (Séries, Reps, Vídeo e Excluir) */}
        <div className="flex flex-col sm:flex-row gap-4 w-full items-end justify-between">
          <div className="flex flex-row gap-3 flex-1 w-full items-end">
            <div className="w-20 space-y-1.5 shrink-0">
              <Label className="text-xs text-muted-foreground">Séries</Label>
              <Input 
                type="number" 
                value={ex.sets}
                className="bg-background/50 border-none h-10 text-center"
                onChange={(e) => updateExercise(dayId, ex.id, 'sets', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="w-28 space-y-1.5 shrink-0">
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input 
                value={ex.reps}
                className="bg-background/50 border-none h-10"
                onChange={(e) => updateExercise(dayId, ex.id, 'reps', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vídeo (Link de Demonstração)</Label>
              <Input 
                placeholder="Link Youtube, Drive ou Instagram"
                value={ex.videoUrl || ''}
                className="bg-background/50 border-none h-10 w-full"
                onChange={(e) => updateExercise(dayId, ex.id, 'videoUrl', e.target.value)}
              />
            </div>
          </div>
          <div className="shrink-0 pt-2 sm:pt-0 w-full sm:w-auto flex justify-end">
            <Button 
              variant="destructive" 
              size="icon" 
              className="w-full sm:w-10 h-10 hover:bg-destructive/90 transition-all shadow-sm"
              onClick={() => removeExercise(dayId, ex.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
