'use client';

import { use, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  Dumbbell, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Edit, 
  UserCheck, 
  Search, 
  ChevronsUpDown, 
  Trash2, 
  User, 
  Loader2,
  Wrench
} from 'lucide-react';

function getGenderInfo(plan: { gender?: string; name?: string; description?: string }) {
  const gender = plan.gender?.toLowerCase();
  const name = plan.name?.toLowerCase() || '';
  const desc = plan.description?.toLowerCase() || '';

  if (gender === 'male' || name.includes('masculino') || name.includes('homem') || desc.includes('masculino')) {
    return {
      label: 'Masculino',
      class: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 8a4 4 0 11-8 0 4 4 0 018 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z" />
        </svg>
      )
    };
  }

  if (gender === 'female' || name.includes('feminino') || name.includes('mulher') || desc.includes('feminino')) {
    return {
      label: 'Feminino',
      class: 'bg-accent/15 text-accent border-accent/25 hover:bg-accent/20',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a5 5 0 100-10 5 5 0 000 10zM12 11v9M9 16h6" />
        </svg>
      )
    };
  }

  return {
    label: 'Personalizado',
    class: 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  };
}

export default function WorkoutDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const firestore = useFirestore();

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

  const isLoading = isPlanLoading || isDaysLoading;

  const [selectedPhaseName, setSelectedPhaseName] = useState('');

  useEffect(() => {
    if (plan && plan.phases && plan.phases.length > 0) {
      setSelectedPhaseName(plan.phases[0].name);
    }
  }, [plan]);

  const filteredDays = useMemo(() => {
    if (!days) return [];
    if (!selectedPhaseName) return days;
    return days.filter((d: any) => {
      const pName = d.phaseName || 'A1';
      return pName.toLowerCase() === selectedPhaseName.toLowerCase();
    });
  }, [days, selectedPhaseName]);

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
               {(() => {
                 const info = getGenderInfo(plan);
                 return (
                   <Badge variant="outline" className={info.class}>
                     {info.icon}
                     {info.label}
                   </Badge>
                 );
               })()}
               <Badge variant="outline" className="bg-primary/5 border-primary/20">
                 {plan.assignedToAthleteIds?.length || 0} Alunos Atribuídos
               </Badge>
                <Button 
                  onClick={() => {
                    if (plan.isPersonalized || plan.isPreConfigured) {
                      router.push(`/dashboard/workouts/personalizado?id=${id}`);
                    } else {
                      router.push(`/dashboard/workouts/${id}/editar`);
                    }
                  }}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-1.5 shadow-sm ml-2 h-9 px-3 text-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar Ficha
                </Button>
            </div>
          </PageHeader>

          {/* Phase Switcher Tabs */}
          {plan.phases && plan.phases.length > 0 && (
            <div className="flex items-center gap-2 bg-background/50 p-3 rounded-2xl border border-primary/10 backdrop-blur-sm overflow-x-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2 whitespace-nowrap">Fases:</span>
              <div className="flex gap-2">
                {plan.phases.map((phase: any) => {
                  const isActive = phase.name === selectedPhaseName;
                  return (
                    <Button
                      key={phase.name}
                      variant={isActive ? "default" : "outline"}
                      onClick={() => setSelectedPhaseName(phase.name)}
                      className={`h-8 px-3 text-xs font-bold flex items-center gap-1.5 ${
                        isActive ? "shadow-sm bg-primary text-primary-foreground font-bold" : "bg-card/50"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${phase.isEnabled ? 'bg-green-500' : 'bg-muted-foreground/35'}`} />
                      {phase.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {(() => {
               const activePhase = plan.phases?.find((p: any) => p.name === selectedPhaseName) || plan;
               return (
                 <Card className="lg:col-span-3 border border-primary/20 bg-primary/5 p-6 rounded-2xl flex flex-wrap gap-6 justify-between items-center backdrop-blur-sm shadow-sm">
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4 w-full">
                     <div>
                       <span className="text-[10px] uppercase text-muted-foreground block font-bold tracking-wider">Objetivo</span>
                       <span className="font-bold text-sm text-primary">{activePhase.objectiveName || 'Geral'}</span>
                     </div>
                     <div>
                       <span className="text-[10px] uppercase text-muted-foreground block font-bold tracking-wider">Método</span>
                       <span className="font-bold text-sm text-primary">{activePhase.methodName || 'Padrão'}</span>
                     </div>
                     <div>
                       <span className="text-[10px] uppercase text-muted-foreground block font-bold tracking-wider">Ritmo</span>
                       <span className="font-bold text-sm text-primary">{activePhase.rhythmName || 'N/A'}</span>
                     </div>
                     <div>
                       <span className="text-[10px] uppercase text-muted-foreground block font-bold tracking-wider">Fase</span>
                       <span className="font-bold text-sm text-primary">{activePhase.phaseName || activePhase.name || 'Geral'}</span>
                     </div>
                     <div>
                       <span className="text-[10px] uppercase text-muted-foreground block font-bold tracking-wider">Carga</span>
                       <span className="font-mono font-bold text-sm text-primary">{activePhase.loadPercentage}%</span>
                     </div>
                     <div>
                       <span className="text-[10px] uppercase text-muted-foreground block font-bold tracking-wider">Intervalo</span>
                       <span className="font-mono font-bold text-sm text-primary">{activePhase.restSeconds}s</span>
                     </div>
                     <div>
                       <span className="text-[10px] uppercase text-muted-foreground block font-bold tracking-wider">Duração</span>
                       <span className="font-bold text-sm text-primary text-wrap">
                         {activePhase.durationWeeks ? `${activePhase.durationWeeks} semanas` : (activePhase.durationFrequency || 'N/A')}
                       </span>
                     </div>
                     <div>
                       <span className="text-[10px] uppercase text-muted-foreground block font-bold tracking-wider">Vencimento</span>
                       <span className="font-mono font-bold text-sm text-primary">
                         {plan.expirationDate ? new Date(plan.expirationDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                       </span>
                     </div>
                     <div>
                       <span className="text-[10px] uppercase text-muted-foreground block font-bold tracking-wider">Professor</span>
                       <span className="font-bold text-sm text-primary truncate block" title={plan.createdByUserName}>
                         {plan.createdByUserName || 'N/A'}
                       </span>
                     </div>
                   </div>
                 </Card>
               );
             })()}

            {/* Workout Days */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Estrutura do Treino
              </h2>
              
              {filteredDays && filteredDays.length > 0 ? (
                <div className="grid gap-6">
                  {filteredDays.map((day: any) => (
                    <Card key={day.id} className="bg-card/50 overflow-hidden border-primary/10">
                      <CardHeader className="bg-primary/5 py-4">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{day.name}</span>
                          <div className="flex gap-2 items-center">
                            {day.isEnabled === false && (
                              <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs font-semibold">
                                Desabilitado
                              </Badge>
                            )}
                            <Badge variant="outline">{day.exercises?.length || 0} Exercícios</Badge>
                          </div>
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
                                  <p className="text-sm text-muted-foreground">
                                    {ex.isTimeBased ? (
                                      <span>{ex.sets} séries x {ex.durationSeconds || 30}s (Tempo)</span>
                                    ) : (
                                      <span>{ex.sets} séries x {ex.reps} reps{ex.carga ? ` | Carga: ${ex.carga}` : ''}</span>
                                    )}
                                  </p>
                                  {ex.description && (
                                    <p className="text-xs text-muted-foreground italic mt-0.5">
                                      Obs: {ex.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {ex.videoUrl && (
                                <a 
                                  href={ex.videoUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs text-primary hover:underline font-semibold bg-primary/5 hover:bg-primary/10 py-1.5 px-3 rounded-lg border border-primary/10 mr-4"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Ver Vídeo
                                </a>
                              )}
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

            {/* Sidebar with Assignment Card and Quick Stats */}
            <div className="lg:col-span-1 space-y-6">
              {plan.isPersonalized ? (
                <Card className="bg-card/40 border-primary/10 p-5 space-y-3">
                  <CardHeader className="p-0 border-b pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Aluno Atribuído
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                        {(plan.athleteName || plan.name?.replace('Plano Personalizado - ', '') || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {plan.athleteName || plan.name?.replace('Plano Personalizado - ', '')}
                        </p>
                        <p className="text-xs text-muted-foreground">Treino exclusivo deste aluno</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <PlanAssignmentCard planId={id} assignedAthleteIds={plan.assignedToAthleteIds || []} />
              )}

              {/* If personalized or pre-configured, show equipment, pre and post workouts */}
              {(plan.isPersonalized || plan.isPreConfigured) && (
                <Card className="bg-card/40 border-primary/10 p-5 space-y-4">
                  <CardHeader className="p-0">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-primary" />
                      Acessórios e Aquecimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    {/* Equipments */}
                    {plan.selectedEquipments && plan.selectedEquipments.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground block uppercase">Equipamentos recomendados:</span>
                        <div className="flex flex-wrap gap-1">
                          {plan.selectedEquipments.map((eq: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[9px] font-bold py-0.5">{eq}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Pre-workout exercises */}
                    {plan.selectedPreWorkouts && plan.selectedPreWorkouts.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground block uppercase">Aquecimento (Pré-Treino):</span>
                        <div className="flex flex-wrap gap-1">
                          {plan.selectedPreWorkouts.map((pre: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-[9px] font-bold border-primary/20 bg-primary/5 text-primary py-0.5">{pre}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post-workout exercises */}
                    {plan.selectedPostWorkouts && plan.selectedPostWorkouts.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground block uppercase">Desaquecimento (Pós-Treino):</span>
                        <div className="flex flex-wrap gap-1">
                          {plan.selectedPostWorkouts.map((pos: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-[9px] font-bold border-accent/25 bg-accent/5 text-accent py-0.5">{pos}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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
      <Toaster />
    </div>
  );
}

function PlanAssignmentCard({ planId, assignedAthleteIds }: { planId: string; assignedAthleteIds: string[] }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [athleteSearchTerm, setAthleteSearchTerm] = useState<string>('');
  const [isAthletePopoverOpen, setIsAthletePopoverOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'userProfiles');
  }, [firestore]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<any>(usersCollectionRef);

  const athletes = useMemo(() => {
    return users?.filter((u: any) => u.roleId === Role.Athlete) || [];
  }, [users]);

  const selectedAthlete = useMemo(() => {
    return athletes.find((a: any) => a.id === selectedAthleteId);
  }, [athletes, selectedAthleteId]);

  const assignedAthletes = useMemo(() => {
    return athletes.filter((a: any) => assignedAthleteIds?.includes(a.id)) || [];
  }, [athletes, assignedAthleteIds]);

  const unassignedAthletes = useMemo(() => {
    return athletes.filter((a: any) => !assignedAthleteIds?.includes(a.id)) || [];
  }, [athletes, assignedAthleteIds]);

  const handleLinkPlan = async () => {
    if (!firestore || !selectedAthleteId) return;
    setIsLinking(true);
    try {
      const { writeBatch, getDocs, collection, arrayUnion } = await import('firebase/firestore');
      const batch = writeBatch(firestore);
      
      const planRef = doc(firestore, 'trainingPlans', planId);
      batch.update(planRef, {
        assignedToAthleteIds: arrayUnion(selectedAthleteId)
      });
      
      // Sync subcollection days for Security Rules
      const daysSnap = await getDocs(collection(firestore, 'trainingPlans', planId, 'workoutDays'));
      daysSnap.forEach((dayDoc) => {
        batch.update(dayDoc.ref, {
          trainingPlanAssignedToAthleteIds: arrayUnion(selectedAthleteId)
        });
      });
      
      await batch.commit();

      toast({
        title: 'Ficha Vinculada!',
        description: `O treino foi atribuído com sucesso para ${selectedAthlete?.firstName || 'o aluno'}.`,
      });
      setSelectedAthleteId('');
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao vincular',
        description: e.message,
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkPlan = async (athleteId: string, athleteName: string) => {
    if (!firestore) return;
    try {
      const { writeBatch, getDocs, collection, arrayRemove } = await import('firebase/firestore');
      const batch = writeBatch(firestore);
      
      const planRef = doc(firestore, 'trainingPlans', planId);
      batch.update(planRef, {
        assignedToAthleteIds: arrayRemove(athleteId)
      });
      
      // Sync subcollection days for Security Rules
      const daysSnap = await getDocs(collection(firestore, 'trainingPlans', planId, 'workoutDays'));
      daysSnap.forEach((dayDoc) => {
        batch.update(dayDoc.ref, {
          trainingPlanAssignedToAthleteIds: arrayRemove(athleteId)
        });
      });
      
      await batch.commit();

      toast({
        title: 'Ficha Desvinculada',
        description: `O treino foi removido de ${athleteName}.`,
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao desvincular',
        description: e.message,
      });
    }
  };

  return (
    <Card className="bg-card/40 border-primary/10 overflow-hidden backdrop-blur-sm shadow-xl p-5 space-y-4">
      <CardHeader className="p-0 space-y-1">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          Alunos Atribuídos
        </CardTitle>
        <CardDescription className="text-xs">
          Vincule este treino a um aluno ou gerencie quem já treina com ele.
        </CardDescription>
      </CardHeader>
      
      <div className="space-y-4">
        {/* Dropdown search athlete to assign */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-muted-foreground">Vincular Novo Aluno</Label>
          <div className="flex gap-2">
            <Popover open={isAthletePopoverOpen} onOpenChange={setIsAthletePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 justify-between bg-background/50 border-input h-10 font-normal hover:bg-background/80 transition-colors px-3 text-xs"
                >
                  {selectedAthlete ? (
                    <span className="font-medium truncate">{`${selectedAthlete.firstName} ${selectedAthlete.lastName}`}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Procurar aluno...</span>
                  )}
                  <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-80 shadow-2xl border-primary/10 bg-popover overflow-hidden" align="start">
                <div className="p-3 border-b border-border/30 flex items-center gap-2 bg-muted/20">
                  <Search className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  <Input 
                    placeholder="Nome do aluno..."
                    className="h-8 text-xs bg-transparent border-none focus-visible:ring-0 p-0 placeholder:font-normal font-medium focus-visible:ring-offset-0 focus-visible:outline-none"
                    value={athleteSearchTerm}
                    onChange={(e) => setAthleteSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                <ScrollArea className="h-48">
                  <div className="p-2 space-y-1">
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    ) : unassignedAthletes
                      ?.filter((ath: any) => 
                        !athleteSearchTerm || 
                        `${ath.firstName} ${ath.lastName}`.toLowerCase().includes(athleteSearchTerm.toLowerCase()) ||
                        ath.email.toLowerCase().includes(athleteSearchTerm.toLowerCase())
                      )
                      .map((ath: any) => (
                        <Button
                          key={ath.id}
                          type="button"
                          variant="ghost"
                          className={cn(
                            "w-full justify-start font-normal text-xs py-2 px-3 transition-colors flex items-center gap-2",
                            selectedAthleteId === ath.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-primary/5'
                          )}
                          onClick={() => {
                            setSelectedAthleteId(ath.id);
                            setIsAthletePopoverOpen(false);
                            setAthleteSearchTerm('');
                          }}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://avatar.vercel.sh/${ath.email}.png`} alt={`${ath.firstName}`} />
                            <AvatarFallback className="text-[8px]"><User className="h-3 w-3" /></AvatarFallback>
                          </Avatar>
                          <div className="text-left truncate">
                            <p className="font-semibold text-foreground truncate">{`${ath.firstName} ${ath.lastName}`}</p>
                          </div>
                        </Button>
                      ))}
                    {unassignedAthletes.length === 0 && (
                      <p className="text-xs text-center p-4 text-muted-foreground">Nenhum aluno disponível</p>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <Button onClick={handleLinkPlan} disabled={!selectedAthleteId || isLinking} className="shrink-0 h-10 text-xs">
              {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vincular'}
            </Button>
          </div>
        </div>

        {/* Assigned list */}
        <div className="space-y-2 pt-2 border-t border-border/30">
          <Label className="text-xs font-semibold text-muted-foreground block">Alunos com esta ficha ({assignedAthletes.length})</Label>
          <ScrollArea className="h-48 pr-2">
            {assignedAthletes.length > 0 ? (
              <div className="space-y-2">
                {assignedAthletes.map((ath: any) => (
                  <div key={ath.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-primary/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={`https://avatar.vercel.sh/${ath.email}.png`} alt={`${ath.firstName}`} />
                        <AvatarFallback className="text-[10px]"><User className="h-3.5 w-3.5" /></AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{`${ath.firstName} ${ath.lastName}`}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{ath.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0" 
                      onClick={() => handleUnlinkPlan(ath.id, `${ath.firstName} ${ath.lastName}`)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center py-6 text-muted-foreground italic">Nenhum aluno de treino.</p>
            )}
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}
