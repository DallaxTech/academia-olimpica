'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Check, 
  ChevronsUpDown, 
  Loader2, 
  User, 
  Dumbbell, 
  BookOpen, 
  UserCheck, 
  PlusCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Role } from '@/lib/types';

interface AssignToStudentCardProps {
  exerciseId: string;
  exerciseName: string;
  exerciseVideoUrl?: string;
}

export function AssignToStudentCard({ exerciseId, exerciseName, exerciseVideoUrl }: AssignToStudentCardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  // Component States
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [athleteSearchTerm, setAthleteSearchTerm] = useState<string>('');
  const [isAthletePopoverOpen, setIsAthletePopoverOpen] = useState(false);

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  const [sets, setSets] = useState<number>(3);
  const [reps, setReps] = useState<string>('10 a 12');
  const [rest, setRest] = useState<number>(60);

  const [loading, setLoading] = useState(false);

  // Fetch all user profiles
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'userProfiles');
  }, [firestore]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<any>(usersCollectionRef);

  // Filter profiles to only get Athletes
  const athletes = React.useMemo(() => {
    return users?.filter((u: any) => u.roleId === Role.Athlete) || [];
  }, [users]);

  // Find the currently selected athlete profile
  const selectedAthlete = React.useMemo(() => {
    return athletes.find((a: any) => a.id === selectedAthleteId);
  }, [athletes, selectedAthleteId]);

  // Fetch all training plans
  const plansCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'trainingPlans');
  }, [firestore]);

  const { data: allPlans, isLoading: isLoadingPlans } = useCollection<any>(plansCollectionRef);

  // Filter plans assigned to the selected athlete
  const assignedPlans = React.useMemo(() => {
    if (!selectedAthleteId || !allPlans) return [];
    return allPlans.filter((plan: any) => 
      plan.assignedToAthleteIds?.includes(selectedAthleteId)
    );
  }, [allPlans, selectedAthleteId]);

  // Filter plans NOT YET assigned to the selected athlete
  const unassignedPlans = React.useMemo(() => {
    if (!selectedAthleteId || !allPlans) return [];
    return allPlans.filter((plan: any) => 
      !plan.assignedToAthleteIds?.includes(selectedAthleteId)
    );
  }, [allPlans, selectedAthleteId]);

  // Fetch workout days for the selected plan
  const daysCollectionRef = useMemoFirebase(() => {
    if (!firestore || !selectedPlanId) return null;
    return query(
      collection(firestore, `trainingPlans/${selectedPlanId}/workoutDays`),
      orderBy('dayOrder', 'asc')
    );
  }, [firestore, selectedPlanId]);

  const { data: workoutDays, isLoading: isLoadingDays } = useCollection<any>(daysCollectionRef);

  // Reset day selection when the plan changes
  React.useEffect(() => {
    setSelectedDayId('');
  }, [selectedPlanId]);

  // Handle assigning a complete training plan to the athlete
  const handleAssignPlan = async () => {
    if (!firestore || !selectedAthleteId || !selectedPlanId) return;
    setLoading(true);
    try {
      const planRef = doc(firestore, 'trainingPlans', selectedPlanId);
      await updateDoc(planRef, {
        assignedToAthleteIds: arrayUnion(selectedAthleteId)
      });

      toast({
        title: 'Ficha Vinculada!',
        description: `O treino foi atribuído com sucesso para ${selectedAthlete.firstName}.`,
      });
      setSelectedPlanId('');
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao vincular',
        description: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle inserting the current exercise into a specific plan's day
  const handleInsertExercise = async () => {
    if (!firestore || !selectedPlanId || !selectedDayId || !exerciseName) return;
    setLoading(true);
    try {
      const dayRef = doc(firestore, `trainingPlans/${selectedPlanId}/workoutDays`, selectedDayId);
      const selectedDay = workoutDays?.find((d: any) => d.id === selectedDayId);
      const currentExercises = selectedDay?.exercises || [];

      // Append new exercise
      const newExercise = {
        exerciseName,
        sets,
        reps,
        videoUrl: exerciseVideoUrl || '',
        isCompleted: false
      };

      await updateDoc(dayRef, {
        exercises: [...currentExercises, newExercise]
      });

      toast({
        title: 'Exercício Inserido!',
        description: `"${exerciseName}" foi adicionado ao ${selectedDay.name} com sucesso.`,
      });

      // Clear details
      setSelectedPlanId('');
      setSelectedDayId('');
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao inserir exercício',
        description: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/40 border-primary/10 overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-primary/5 py-4 border-b border-primary/10">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          Atribuir ao Aluno
        </CardTitle>
        <CardDescription>
          Vincule uma ficha completa ou insira este exercício no treino de um aluno.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Step 1: Select Student (Athlete) */}
        <div className="space-y-2 flex flex-col">
          <Label className="text-sm font-semibold">1. Selecione o Aluno</Label>
          <Popover open={isAthletePopoverOpen} onOpenChange={setIsAthletePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between bg-background/50 border-input h-12 font-normal hover:bg-background/80 transition-colors px-3 box-border"
              >
                {selectedAthlete ? (
                  <div className="flex items-center gap-2 text-left truncate">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`https://avatar.vercel.sh/${selectedAthlete.email}.png`} alt={`${selectedAthlete.firstName}`} />
                      <AvatarFallback className="text-[10px]"><User className="h-3.5 w-3.5" /></AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate">{`${selectedAthlete.firstName} ${selectedAthlete.lastName}`}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Procurar aluno...</span>
                )}
                <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="p-0 w-80 shadow-2xl border-primary/10 bg-popover overflow-hidden" align="start">
              <div className="p-3 border-b border-border/30 flex items-center gap-2 bg-muted/20">
                <Search className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <Input 
                  placeholder="Nome do aluno..."
                  className="h-8 text-sm bg-transparent border-none focus-visible:ring-0 p-0 placeholder:font-normal font-medium focus-visible:ring-offset-0 focus-visible:outline-none"
                  value={athleteSearchTerm}
                  onChange={(e) => setAthleteSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <ScrollArea className="h-60">
                <div className="p-2 space-y-1">
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : athletes
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
                          "w-full justify-start font-normal text-sm h-auto py-2 px-3 transition-colors flex items-center gap-2",
                          selectedAthleteId === ath.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-primary/5'
                        )}
                        onClick={() => {
                          setSelectedAthleteId(ath.id);
                          setIsAthletePopoverOpen(false);
                          setAthleteSearchTerm('');
                          setSelectedPlanId('');
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${ath.email}.png`} alt={`${ath.firstName}`} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="text-left truncate">
                          <p className="font-semibold text-foreground truncate">{`${ath.firstName} ${ath.lastName}`}</p>
                          <p className="text-xs text-muted-foreground truncate">{ath.email}</p>
                        </div>
                        {selectedAthleteId === ath.id && <Check className="w-4 h-4 ml-auto text-primary shrink-0" />}
                      </Button>
                    ))}
                  
                  {athletes.length === 0 && (
                    <p className="text-xs text-center p-4 text-muted-foreground">Nenhum aluno cadastrado</p>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        {/* Show actions only when an athlete is selected */}
        {selectedAthleteId ? (
          <Tabs defaultValue="assign-plan" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="assign-plan" className="text-xs font-semibold py-2">
                Vincular Ficha
              </TabsTrigger>
              <TabsTrigger value="add-exercise" className="text-xs font-semibold py-2">
                Inserir Exercício
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Assign Plan */}
            <TabsContent value="assign-plan" className="space-y-4 pt-1 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label htmlFor="plan-to-assign" className="text-xs text-muted-foreground">Selecione uma ficha para atribuir</Label>
                {isLoadingPlans ? (
                  <div className="h-10 flex items-center justify-center border rounded-lg bg-background/50">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                ) : unassignedPlans.length > 0 ? (
                  <Select onValueChange={setSelectedPlanId} value={selectedPlanId}>
                    <SelectTrigger id="plan-to-assign" className="bg-background/50">
                      <SelectValue placeholder="Escolha um plano de treino..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedPlans.map((plan: any) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} ({plan.daysCount || 0} dias)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-center p-4 border border-dashed rounded-lg bg-background/30 text-muted-foreground">
                    Todos os treinos disponíveis já foram atribuídos a este aluno.
                  </p>
                )}
              </div>

              <Button
                type="button"
                className="w-full mt-2 font-semibold"
                disabled={loading || !selectedPlanId}
                onClick={handleAssignPlan}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                Vincular Ficha ao Aluno
              </Button>
            </TabsContent>

            {/* TAB 2: Insert Exercise */}
            <TabsContent value="add-exercise" className="space-y-4 pt-1 animate-in fade-in duration-300">
              {assignedPlans.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-xl bg-background/20 space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50" />
                  <h4 className="text-sm font-semibold">Nenhuma Ficha Vinculada</h4>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                    Vincule primeiro uma ficha ao aluno para poder inserir este exercício.
                  </p>
                </div>
              ) : (
                <>
                  {/* Select Assigned Plan */}
                  <div className="space-y-1.5">
                    <Label htmlFor="target-plan" className="text-xs text-muted-foreground">Selecione o plano de treino</Label>
                    <Select onValueChange={setSelectedPlanId} value={selectedPlanId}>
                      <SelectTrigger id="target-plan" className="bg-background/50">
                        <SelectValue placeholder="Selecione a ficha..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assignedPlans.map((plan: any) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Plan Day (loads only when plan is selected) */}
                  {selectedPlanId && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="target-day" className="text-xs text-muted-foreground">Escolha o dia de treino</Label>
                      {isLoadingDays ? (
                        <div className="h-10 flex items-center justify-center border rounded-lg bg-background/50">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      ) : workoutDays && workoutDays.length > 0 ? (
                        <Select onValueChange={setSelectedDayId} value={selectedDayId}>
                          <SelectTrigger id="target-day" className="bg-background/50">
                            <SelectValue placeholder="Selecione o treino/dia..." />
                          </SelectTrigger>
                          <SelectContent>
                            {workoutDays.map((day: any) => (
                              <SelectItem key={day.id} value={day.id}>
                                {day.name} ({day.exercises?.length || 0} exs)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg text-center font-medium">
                          Esta ficha não possui dias configurados.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Customization variables */}
                  {selectedPlanId && selectedDayId && (
                    <div className="space-y-3 pt-2 border-t border-border/30 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">Prescrição do Exercício</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="sets" className="text-[11px] text-muted-foreground">Séries</Label>
                          <Input 
                            id="sets"
                            type="number"
                            value={sets}
                            onChange={(e) => setSets(parseInt(e.target.value) || 3)}
                            className="bg-background/50 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="reps" className="text-[11px] text-muted-foreground">Reps</Label>
                          <Input 
                            id="reps"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            className="bg-background/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="rest" className="text-[11px] text-muted-foreground font-medium">Descanso (Segundos)</Label>
                        <Input 
                          id="rest"
                          type="number"
                          value={rest}
                          onChange={(e) => setRest(parseInt(e.target.value) || 60)}
                          className="bg-background/50"
                        />
                      </div>

                      <Button
                        type="button"
                        className="w-full mt-3 font-semibold"
                        disabled={loading || !selectedDayId}
                        onClick={handleInsertExercise}
                      >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                        Inserir no Treino
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-8 border border-dashed rounded-xl bg-background/20 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Dumbbell className="w-8 h-8 opacity-20" />
            <p className="text-xs">Selecione um aluno acima para visualizar as opções de vinculação.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
