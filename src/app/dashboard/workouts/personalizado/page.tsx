'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, onSnapshot, writeBatch, serverTimestamp, where } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Search, 
  Loader2, 
  User, 
  Target, 
  Zap, 
  Activity, 
  TrendingUp, 
  Wrench, 
  Dumbbell, 
  Apple, 
  Coffee,
  Check,
  Flame,
  RefreshCw
} from 'lucide-react';
import { Role, UserProfile } from '@/lib/types';

interface CustomExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  load: string;
  videoUrl?: string;
}

function PersonalizedWorkoutBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const [isPreConfigured, setIsPreConfigured] = useState(() => searchParams.get('preConfigured') === 'true');
  const [planName, setPlanName] = useState('');
  const [assignedAthleteIds, setAssignedAthleteIds] = useState<string[]>([]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  // Load currently logged in user profile (for the professor's name)
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Loading and Selections state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Firestore Libraries
  const [athletes, setAthletes] = useState<UserProfile[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [rhythms, setRhythms] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [preWorkouts, setPreWorkouts] = useState<any[]>([]);
  const [postWorkouts, setPostWorkouts] = useState<any[]>([]);
  const [exercisesLibrary, setExercisesLibrary] = useState<any[]>([]);

  // Search/Filter terms for selectors
  const [athleteSearch, setAthleteSearch] = useState('');
  const [objectiveSearch, setObjectiveSearch] = useState('');
  const [methodSearch, setMethodSearch] = useState('');
  const [rhythmSearch, setRhythmSearch] = useState('');
  const [phaseSearch, setPhaseSearch] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [preWorkoutSearch, setPreWorkoutSearch] = useState('');
  const [postWorkoutSearch, setPostWorkoutSearch] = useState('');

  // Dropdown open states
  const [showAthleteList, setShowAthleteList] = useState(false);

  // Form selections
  const [selectedAthlete, setSelectedAthlete] = useState<UserProfile | null>(null);
  const [selectedObjective, setSelectedObjective] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedRhythm, setSelectedRhythm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [loadPercentage, setLoadPercentage] = useState(50);
  const [restSeconds, setRestSeconds] = useState(60);
  const [durationFrequency, setDurationFrequency] = useState('4 semanas, 3x por semana');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [weeklyFrequency, setWeeklyFrequency] = useState(3);
  const [expirationDate, setExpirationDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  });

  // Checklists (Multi-select)
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedPreWorkouts, setSelectedPreWorkouts] = useState<string[]>([]);
  const [selectedPostWorkouts, setSelectedPostWorkouts] = useState<string[]>([]);

  // Exercise builder list
  const [workoutExercises, setWorkoutExercises] = useState<CustomExercise[]>([
    { id: 'ex-1', name: '', sets: 3, reps: '10', load: '' }
  ]);

  // Load libraries from Firestore onSnapshot (realtime)
  useEffect(() => {
    if (!firestore) return;

    setLoading(true);

    const unsubscribes: (() => void)[] = [];

    // 1. Athletes
    const qAthletes = query(collection(firestore, 'userProfiles'), where('roleId', '==', Role.Athlete));
    unsubscribes.push(onSnapshot(qAthletes, (snapshot) => {
      setAthletes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserProfile));
    }));

    // 2. Objectives
    const qObjectives = query(collection(firestore, 'objectives'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qObjectives, (snapshot) => {
      setObjectives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 3. Methods
    const qMethods = query(collection(firestore, 'methods'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qMethods, (snapshot) => {
      setMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 4. Rhythms
    const qRhythms = query(collection(firestore, 'rhythms'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qRhythms, (snapshot) => {
      setRhythms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 5. Phases
    const qPhases = query(collection(firestore, 'trainingPhases'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qPhases, (snapshot) => {
      setPhases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 6. Equipments
    const qEquipments = query(collection(firestore, 'equipment'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qEquipments, (snapshot) => {
      setEquipments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 7. Pre workouts
    const qPre = query(collection(firestore, 'preWorkouts'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qPre, (snapshot) => {
      setPreWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 8. Post workouts
    const qPost = query(collection(firestore, 'postWorkouts'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qPost, (snapshot) => {
      setPostWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 9. Exercises library
    const qEx = query(collection(firestore, 'exercises'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qEx, (snapshot) => {
      setExercisesLibrary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }));

  }, [firestore]);

  // Load existing plan data if editId is provided
  useEffect(() => {
    if (!firestore || !editId) return;

    const loadPlanData = async () => {
      try {
        const { getDoc, getDocs } = await import('firebase/firestore');
        const planDoc = await getDoc(doc(firestore, 'trainingPlans', editId));
        if (planDoc.exists()) {
          const planData = planDoc.data();
          
          setIsPreConfigured(planData.isPreConfigured === true);
          setPlanName(planData.name || '');
          setGender(planData.gender || 'male');
          setAssignedAthleteIds(planData.assignedToAthleteIds || []);
          
          setSelectedObjective(planData.objectiveName || '');
          setObjectiveSearch(planData.objectiveName || '');
          
          setSelectedMethod(planData.methodName || '');
          setMethodSearch(planData.methodName || '');
          
          setSelectedRhythm(planData.rhythmName || '');
          setRhythmSearch(planData.rhythmName || '');
          
          setSelectedPhase(planData.phaseName || '');
          setPhaseSearch(planData.phaseName || '');
          
          setLoadPercentage(planData.loadPercentage ?? 50);
          setRestSeconds(planData.restSeconds ?? 60);
          setDurationFrequency(planData.durationFrequency || '');
          setDurationWeeks(planData.durationWeeks ?? 4);
          setWeeklyFrequency(planData.weeklyFrequency ?? 3);
          setExpirationDate(planData.expirationDate || '');
          
          setSelectedEquipments(planData.selectedEquipments || []);
          setSelectedPreWorkouts(planData.selectedPreWorkouts || []);
          setSelectedPostWorkouts(planData.selectedPostWorkouts || []);

          if (planData.athleteId) {
            const athleteDoc = await getDoc(doc(firestore, 'userProfiles', planData.athleteId));
            if (athleteDoc.exists()) {
              const aData = athleteDoc.data();
              const fullAthlete = { id: athleteDoc.id, ...aData } as UserProfile;
              setSelectedAthlete(fullAthlete);
              setAthleteSearch(`${fullAthlete.firstName} ${fullAthlete.lastName || ''}`);
            }
          }

          const daysSnap = await getDocs(collection(firestore, 'trainingPlans', editId, 'workoutDays'));
          if (!daysSnap.empty) {
            const firstDay = daysSnap.docs[0].data();
            if (firstDay.exercises && firstDay.exercises.length > 0) {
              setWorkoutExercises(firstDay.exercises.map((ex: any, idx: number) => ({
                id: ex.id || `ex-${idx}`,
                name: ex.exerciseName || ex.name || '',
                sets: ex.sets || 3,
                reps: ex.reps || '10',
                load: ex.carga || '',
                videoUrl: ex.videoUrl || ''
              })));
            }
          }
        }
      } catch (error) {
        console.error('Error loading plan for edit:', error);
      }
    };

    loadPlanData();
  }, [firestore, editId]);

  // Handle athlete selection
  const selectAthlete = (athlete: UserProfile) => {
    setSelectedAthlete(athlete);
    setAthleteSearch(`${athlete.firstName} ${athlete.lastName || ''}`);
    setShowAthleteList(false);
    if (athlete.gender) {
      setGender(athlete.gender.toLowerCase() === 'female' ? 'female' : 'male');
    }
  };

  // Toggle multi-select items
  const toggleEquipment = (name: string) => {
    setSelectedEquipments(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const togglePreWorkout = (name: string) => {
    setSelectedPreWorkouts(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const togglePostWorkout = (name: string) => {
    setSelectedPostWorkouts(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  // Exercise builder actions
  const addExercise = () => {
    setWorkoutExercises([
      ...workoutExercises,
      { id: `ex-${Date.now()}`, name: '', sets: 3, reps: '10', load: '' }
    ]);
  };

  const removeExercise = (index: number) => {
    if (workoutExercises.length === 1) return;
    setWorkoutExercises(workoutExercises.filter((_, idx) => idx !== index));
  };

  const updateExercise = (index: number, field: keyof CustomExercise, value: string | number) => {
    setWorkoutExercises(
      workoutExercises.map((ex, idx) => idx === index ? { ...ex, [field]: value } : ex)
    );
  };

  // Save personalized plan to Firestore
  const handleSavePlan = async () => {
    if (isPreConfigured) {
      if (!planName.trim()) {
        toast({
          variant: 'destructive',
          title: 'Nome do Treino',
          description: 'Por favor, insira o nome do treino pré-configurado.',
        });
        return;
      }
    } else {
      if (!selectedAthlete) {
        toast({
          variant: 'destructive',
          title: 'Selecione um Aluno',
          description: 'É necessário vincular este plano a um aluno.',
        });
        return;
      }
    }

    if (workoutExercises.some(ex => !ex.name.trim())) {
      toast({
        variant: 'destructive',
        title: 'Exercício em branco',
        description: 'Por favor, preencha o nome de todos os exercícios adicionados.',
      });
      return;
    }

    if (!firestore || !user) return;

    setSaving(true);
    try {
      const batch = writeBatch(firestore);
      const planRef = editId ? doc(firestore, 'trainingPlans', editId) : doc(collection(firestore, 'trainingPlans'));
      const athleteName = selectedAthlete ? `${selectedAthlete.firstName} ${selectedAthlete.lastName || ''}` : '';

      // 1. Create main training plan metadata
      const planData: any = {
        name: isPreConfigured ? planName.trim() : `Plano Personalizado - ${athleteName}`,
        description: `Treino focado em ${selectedObjective || 'Geral'}. Periodização: ${selectedPhase || 'Fase Geral'}. Método: ${selectedMethod || 'Padrão'}.`,
        isPersonalized: !isPreConfigured,
        isPreConfigured: isPreConfigured,
        gender: gender,
        objectiveName: selectedObjective,
        methodName: selectedMethod,
        rhythmName: selectedRhythm,
        phaseName: selectedPhase,
        loadPercentage: Number(loadPercentage),
        restSeconds: Number(restSeconds),
        durationWeeks: Number(durationWeeks),
        weeklyFrequency: Number(weeklyFrequency),
        durationFrequency: `${durationWeeks} semanas, ${weeklyFrequency}x por semana`,
        expirationDate: expirationDate,
        selectedEquipments,
        selectedPreWorkouts,
        selectedPostWorkouts,
        updatedAt: serverTimestamp(),
      };

      if (isPreConfigured) {
        planData.athleteId = null;
        planData.athleteName = null;
        if (!editId) {
          planData.assignedToAthleteIds = [];
        }
      } else {
        planData.athleteId = selectedAthlete!.id;
        planData.athleteName = athleteName;
        planData.assignedToAthleteIds = [selectedAthlete!.id];
      }

      if (!editId) {
        planData.id = planRef.id;
        planData.createdAt = serverTimestamp();
        planData.createdByUserId = user.uid;
        planData.createdByUserName = userProfile?.firstName 
          ? `${userProfile.firstName} ${userProfile.lastName || ''}` 
          : user.email || 'Professor';
      }

      batch.set(planRef, planData, { merge: true });

      // 2. Determine dayRef
      let dayRef;
      if (editId) {
        const { getDocs } = await import('firebase/firestore');
        const daysSnap = await getDocs(collection(firestore, 'trainingPlans', editId, 'workoutDays'));
        if (!daysSnap.empty) {
          dayRef = doc(firestore, 'trainingPlans', editId, 'workoutDays', daysSnap.docs[0].id);
        } else {
          dayRef = doc(collection(firestore, `trainingPlans/${editId}/workoutDays`));
        }
      } else {
        dayRef = doc(collection(firestore, `trainingPlans/${planRef.id}/workoutDays`));
      }

      const dayData = {
        id: dayRef.id,
        dayOrder: 1,
        name: 'Treino A',
        trainingPlanOwnerId: user.uid,
        trainingPlanAssignedToAthleteIds: isPreConfigured ? assignedAthleteIds : [selectedAthlete!.id],
        exercises: workoutExercises.map((ex, index) => ({
          id: ex.id || `exercise-${index}`,
          exerciseName: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          carga: ex.load,
          videoUrl: ex.videoUrl || '',
          isCompleted: false
        }))
      };

      batch.set(dayRef, dayData, { merge: true });

      // Commit transaction
      await batch.commit();

      toast({
        title: editId ? 'Plano Atualizado com Sucesso!' : 'Plano Salvo com Sucesso!',
        description: editId 
          ? 'O plano de treino foi atualizado.'
          : isPreConfigured
            ? 'O treino pré-configurado foi criado com sucesso.'
            : `O plano de treino personalizado foi atribuído a ${athleteName}.`,
      });

      // Redirect back to workouts list
      setTimeout(() => router.push('/dashboard/workouts'), 1500);

    } catch (error: any) {
      console.error('Error saving personalized plan:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar o plano de treino.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Filtered lists for inputs
  const filteredAthletes = athletes.filter(a => 
    `${a.firstName} ${a.lastName || ''}`.toLowerCase().includes(athleteSearch.toLowerCase())
  );

  const filteredObjectives = objectives.filter(o => 
    o.name?.toLowerCase().includes(objectiveSearch.toLowerCase())
  );

  const filteredMethods = methods.filter(m => 
    m.name?.toLowerCase().includes(methodSearch.toLowerCase())
  );

  const filteredRhythms = rhythms.filter(r => 
    r.name?.toLowerCase().includes(rhythmSearch.toLowerCase())
  );

  const filteredPhases = phases.filter(p => 
    p.name?.toLowerCase().includes(phaseSearch.toLowerCase())
  );

  const filteredEquipments = equipments.filter(eq => 
    eq.name?.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  const filteredPreWorkouts = preWorkouts.filter(pre => 
    pre.name?.toLowerCase().includes(preWorkoutSearch.toLowerCase())
  );

  const filteredPostWorkouts = postWorkouts.filter(pos => 
    pos.name?.toLowerCase().includes(postWorkoutSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Carregando bibliotecas e cadastros...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4 md:p-8 space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/50 p-6 rounded-2xl border border-primary/10 backdrop-blur-sm sticky top-4 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10">
            <Link href="/dashboard/workouts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary">
              {editId 
                ? (isPreConfigured ? 'Editar Treino Pré-Configurado' : 'Editar Plano Personalizado') 
                : (isPreConfigured ? 'Criar Treino Pré-Configurado' : 'Criar Plano Personalizado')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isPreConfigured 
                ? 'Monte modelos de treino reutilizáveis que podem ser vinculados a múltiplos alunos depois.' 
                : 'Monte treinos individuais vinculando objetivos, ritmos e métodos específicos.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSavePlan} disabled={saving} className="flex-1 sm:flex-none shadow-md shadow-primary/20">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Plano
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Configs */}
        <div className="lg:col-span-2 space-y-6">
          {isPreConfigured ? (
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm relative z-20">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-base flex items-center gap-2 text-foreground font-headline">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  Identificação do Modelo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Nome do Treino Pré-Configurado</Label>
                  <Input 
                    id="plan-name"
                    placeholder="Ex: Treino de Hipertrofia Avançado"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="bg-background/50 border-primary/20 text-base font-semibold"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Este nome será exibido na listagem de modelos e para os alunos vinculados.</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-primary/5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gênero Alvo</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                        gender === 'male'
                          ? 'bg-blue-600/10 border-blue-500/50 text-blue-500 font-bold shadow-sm'
                          : 'border-primary/10 hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      Homem
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                        gender === 'female'
                          ? 'bg-pink-500/10 border-pink-500/50 text-pink-500 font-bold shadow-sm'
                          : 'border-primary/10 hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      Mulher
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm relative focus-within:z-40 z-20">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-base flex items-center gap-2 text-foreground font-headline">
                  <User className="h-4 w-4 text-primary" />
                  Vincular ao Aluno
                </CardTitle>
              </CardHeader>
              <CardContent className={`pt-4 relative ${showAthleteList ? 'z-50' : 'z-10'}`}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="athlete-search">Selecionar Aluno</Label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                      <Input 
                        id="athlete-search"
                        placeholder="Digite o nome do aluno..."
                        value={athleteSearch}
                        onChange={(e) => {
                          setAthleteSearch(e.target.value);
                          setShowAthleteList(true);
                          if (selectedAthlete) setSelectedAthlete(null);
                        }}
                        onFocus={() => setShowAthleteList(true)}
                        className="pl-9 bg-background/50 border-primary/20 text-base"
                        required
                      />
                    </div>
                  </div>

                  {/* Athlete Dropdown */}
                  {showAthleteList && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setShowAthleteList(false)}
                      />
                      <Card className="absolute left-4 right-4 z-50 mt-1 max-h-56 overflow-y-auto shadow-2xl border-primary/10 bg-popover text-foreground">
                        <div className="p-2 space-y-1">
                          {filteredAthletes.map(athlete => (
                            <button
                              key={athlete.id}
                              onClick={() => selectAthlete(athlete)}
                              className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-primary/15 hover:text-primary font-medium relative z-50"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                {athlete.firstName[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold">{`${athlete.firstName} ${athlete.lastName || ''}`}</p>
                                <p className="text-xs text-muted-foreground">{athlete.email}</p>
                              </div>
                            </button>
                          ))}
                          {filteredAthletes.length === 0 && (
                            <p className="text-xs text-center p-4 text-muted-foreground">Nenhum aluno encontrado.</p>
                          )}
                        </div>
                      </Card>
                    </>
                  )}

                  {selectedAthlete && (
                    <div className="mt-1 flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">
                        {selectedAthlete.firstName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{`${selectedAthlete.firstName} ${selectedAthlete.lastName || ''}`}</p>
                        <p className="text-xs text-muted-foreground">{selectedAthlete.email}</p>
                      </div>
                      <Badge className="ml-auto bg-primary text-primary-foreground font-bold">Selecionado</Badge>
                    </div>
                  )}

                  <div className="space-y-2 pt-3 border-t border-primary/5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gênero do Aluno/Ficha</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                          gender === 'male'
                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-500 font-bold shadow-sm'
                            : 'border-primary/10 hover:bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        Homem
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                          gender === 'female'
                            ? 'bg-pink-500/10 border-pink-500/50 text-pink-500 font-bold shadow-sm'
                            : 'border-primary/10 hover:bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        Mulher
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Plan Configs */}
          <Card className="border-primary/10 bg-card/40 backdrop-blur-sm relative focus-within:z-40 z-10">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base flex items-center gap-2 text-foreground font-headline">
                <Target className="h-4 w-4 text-primary" />
                Prescrição Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Objectives */}
              <div className="space-y-1.5">
                <Label htmlFor="objective">Objetivo</Label>
                <div className="flex gap-2">
                  <SelectBox 
                    placeholder="Selecione o objetivo..."
                    value={selectedObjective}
                    onChange={setSelectedObjective}
                    items={filteredObjectives}
                    searchTerm={objectiveSearch}
                    setSearchTerm={setObjectiveSearch}
                    icon={Target}
                  />
                </div>
              </div>

              {/* Methods */}
              <div className="space-y-1.5">
                <Label htmlFor="method">Método</Label>
                <SelectBox 
                  placeholder="Selecione o método..."
                  value={selectedMethod}
                  onChange={setSelectedMethod}
                  items={filteredMethods}
                  searchTerm={methodSearch}
                  setSearchTerm={setMethodSearch}
                  icon={Zap}
                />
              </div>

              {/* Rhythms */}
              <div className="space-y-1.5">
                <Label htmlFor="rhythm">Ritmo / Cadência</Label>
                <SelectBox 
                  placeholder="Selecione o ritmo..."
                  value={selectedRhythm}
                  onChange={setSelectedRhythm}
                  items={filteredRhythms}
                  searchTerm={rhythmSearch}
                  setSearchTerm={setRhythmSearch}
                  icon={Activity}
                />
              </div>

              {/* Phase */}
              <div className="space-y-1.5">
                <Label htmlFor="phase">Fase do Treino</Label>
                <SelectBox 
                  placeholder="Selecione a fase..."
                  value={selectedPhase}
                  onChange={setSelectedPhase}
                  items={filteredPhases}
                  searchTerm={phaseSearch}
                  setSearchTerm={setPhaseSearch}
                  icon={TrendingUp}
                />
              </div>

              {/* Global Load & Rest */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="load-pct">Carga Geral (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="load-pct"
                      type="number"
                      min={1}
                      max={100}
                      value={loadPercentage}
                      onChange={(e) => setLoadPercentage(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      className="bg-background/50 border-primary/20 text-center font-bold text-base"
                    />
                    <span className="text-sm font-bold text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rest">Descanso Geral (s)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="rest"
                      type="number"
                      min={0}
                      value={restSeconds}
                      onChange={(e) => setRestSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-background/50 border-primary/20 text-center font-bold text-base"
                    />
                    <span className="text-sm font-bold text-muted-foreground">s</span>
                  </div>
                </div>
              </div>

              {/* Duration and Expiration */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="duration-weeks">Duração (Semanas)</Label>
                  <Input 
                    id="duration-weeks"
                    type="number"
                    min={1}
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-background/50 border-primary/20 text-base font-bold text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekly-freq">Frequência Semanal</Label>
                  <Input 
                    id="weekly-freq"
                    type="number"
                    min={1}
                    max={7}
                    value={weeklyFrequency}
                    onChange={(e) => setWeeklyFrequency(Math.max(1, Math.min(7, parseInt(e.target.value) || 1)))}
                    className="bg-background/50 border-primary/20 text-base font-bold text-center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Prazo de Vencimento</Label>
                <Input 
                  id="expiration"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="bg-background/50 border-primary/20 text-base"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Exercises & Checklists */}
        <div className="lg:col-span-3 space-y-6">
          {/* Exercises Section */}
           <Card className="border-primary/10 bg-card/40 backdrop-blur-sm relative focus-within:z-40 z-20">
            <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-foreground font-headline">
                <Dumbbell className="h-4 w-4 text-primary animate-bounce" />
                Lista de Exercícios
              </CardTitle>
              <Button onClick={addExercise} variant="outline" size="sm" className="bg-primary/10 border-primary/25 hover:bg-primary/20 text-primary font-bold">
                <Plus className="h-4 w-4 mr-1.5" /> Adicionar Exercício
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {workoutExercises.map((ex, index) => (
                <div key={ex.id} className="p-4 bg-background/50 rounded-xl border border-primary/10 space-y-4 relative group transition-all duration-300 hover:border-primary/30 focus-within:z-30 z-10">
                  
                  {/* Row 1: Exercise Selection */}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Exercício {index + 1}</Label>
                      <SelectBox 
                        placeholder="Selecione o exercício..."
                        value={ex.name}
                        onChange={(val) => {
                          updateExercise(index, 'name', val);
                          const matchingEx = exercisesLibrary.find(item => item.name === val);
                          if (matchingEx?.videoUrl) {
                            updateExercise(index, 'videoUrl', matchingEx.videoUrl);
                          }
                        }}
                        items={exercisesLibrary.filter(item => !ex.name || item.name.toLowerCase().includes(ex.name.toLowerCase()))}
                        searchTerm={ex.name}
                        setSearchTerm={(val) => updateExercise(index, 'name', val)}
                        icon={Dumbbell}
                      />
                    </div>
                    {workoutExercises.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeExercise(index)}
                        className="text-destructive hover:bg-destructive/15 h-10 w-10 border border-transparent hover:border-destructive/10 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Row 2: Sets, Reps, Load, Video link */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Séries</Label>
                      <Input 
                        type="number"
                        min={1}
                        value={ex.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                        className="bg-background/40 h-9 text-center border-primary/10 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Repetições</Label>
                      <Input 
                        value={ex.reps}
                        onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                        placeholder="Ex: 10 ou 12"
                        className="bg-background/40 h-9 border-primary/10 text-sm text-center font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Carga Inicial</Label>
                      <Input 
                        value={ex.load}
                        onChange={(e) => updateExercise(index, 'load', e.target.value)}
                        placeholder="Ex: 20kg / S/C"
                        className="bg-background/40 h-9 border-primary/10 text-sm text-center font-semibold text-primary"
                      />
                    </div>
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Demonstração</Label>
                      <Input 
                        value={ex.videoUrl || ''}
                        onChange={(e) => updateExercise(index, 'videoUrl', e.target.value)}
                        placeholder="Link do vídeo (opcional)"
                        className="bg-background/40 h-9 border-primary/10 text-xs"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </CardContent>
          </Card>

          {/* Checklists: Equipments, Pre/Post Workouts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Equipments */}
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm">
              <CardHeader className="py-3.5 border-b p-4">
                <CardTitle className="text-sm flex items-center gap-2 font-headline">
                  <Wrench className="h-4 w-4 text-primary" />
                  Equipamentos
                </CardTitle>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input 
                    placeholder="Filtrar..."
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background/50 border-primary/15"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-44 pr-1">
                  <div className="space-y-1">
                    {filteredEquipments.map(item => {
                      const isChecked = selectedEquipments.includes(item.name);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => toggleEquipment(item.name)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none border transition-colors ${
                            isChecked 
                              ? 'bg-primary/10 border-primary/30 text-primary font-bold' 
                              : 'border-transparent hover:bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          <span>{item.name}</span>
                          {isChecked && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Pre Workouts */}
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm">
              <CardHeader className="py-3.5 border-b p-4">
                <CardTitle className="text-sm flex items-center gap-2 font-headline">
                  <Flame className="h-4 w-4 text-primary" />
                  Pré Treinos
                </CardTitle>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input 
                    placeholder="Filtrar..."
                    value={preWorkoutSearch}
                    onChange={(e) => setPreWorkoutSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background/50 border-primary/15"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-44 pr-1">
                  <div className="space-y-1">
                    {filteredPreWorkouts.map(item => {
                      const isChecked = selectedPreWorkouts.includes(item.name);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => togglePreWorkout(item.name)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none border transition-colors ${
                            isChecked 
                              ? 'bg-primary/10 border-primary/30 text-primary font-bold' 
                              : 'border-transparent hover:bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          <span>{item.name}</span>
                          {isChecked && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Post Workouts */}
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm">
              <CardHeader className="py-3.5 border-b p-4">
                <CardTitle className="text-sm flex items-center gap-2 font-headline">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Pós Treinos
                </CardTitle>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input 
                    placeholder="Filtrar..."
                    value={postWorkoutSearch}
                    onChange={(e) => setPostWorkoutSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background/50 border-primary/15"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-44 pr-1">
                  <div className="space-y-1">
                    {filteredPostWorkouts.map(item => {
                      const isChecked = selectedPostWorkouts.includes(item.name);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => togglePostWorkout(item.name)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none border transition-colors ${
                            isChecked 
                              ? 'bg-primary/10 border-primary/30 text-primary font-bold' 
                              : 'border-transparent hover:bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          <span>{item.name}</span>
                          {isChecked && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

// Searchable Custom SelectBox Component
interface SelectBoxProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  items: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  icon: React.ComponentType<any>;
}

function SelectBox({ placeholder, value, onChange, items, searchTerm, setSearchTerm, icon: Icon }: SelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`}>
      <div className="relative">
        <Icon className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
        <Input
          placeholder={placeholder}
          value={value || searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (value) onChange('');
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 bg-background/50 border-primary/20 w-full text-base font-semibold"
        />
      </div>

      {isOpen && (
        <Card className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto shadow-2xl border-primary/10 bg-popover text-foreground">
          <div className="p-1.5 space-y-0.5">
            {/* Custom entry if not in list */}
            {searchTerm.trim() && !items.some(item => item.name.toLowerCase() === searchTerm.toLowerCase()) && (
              <button
                onClick={() => {
                  onChange(searchTerm);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/15 text-primary font-bold flex items-center justify-between"
              >
                <span>Usar: "{searchTerm}"</span>
                <Plus className="h-4 w-4" />
              </button>
            )}

            {items.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.name);
                  setSearchTerm(item.name);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-primary/10 hover:text-primary font-semibold block"
              >
                {item.name}
              </button>
            ))}
            {items.length === 0 && !searchTerm.trim() && (
              <p className="text-xs text-center py-4 text-muted-foreground">Nenhum item cadastrado.</p>
            )}
          </div>
        </Card>
      )}

      {/* Backdrop overlay to close the list when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default function PersonalizedWorkoutBuilder() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Carregando formulário...</p>
      </div>
    }>
      <PersonalizedWorkoutBuilderInner />
    </Suspense>
  );
}
