'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Dumbbell, Settings, Edit, RefreshCw, Trash2, RotateCcw, 
  AlertTriangle, Check, Search, Calendar, ChevronRight, HelpCircle
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface WorkoutAdaptationSheetProps {
  athleteId: string;
  planId: string;
  planName: string;
  trigger?: React.ReactNode;
}

export function WorkoutAdaptationSheet({ athleteId, planId, planName, trigger }: WorkoutAdaptationSheetProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeDayId, setActiveDayId] = useState<string>('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Form states for the customization dialog
  const [customizingExercise, setCustomizingExercise] = useState<any>(null);
  const [isCustomizingOpen, setIsCustomizingOpen] = useState(false);
  const [isSelectExerciseOpen, setIsSelectExerciseOpen] = useState(false);
  
  // Customization field values
  const [isExcluded, setIsExcluded] = useState(false);
  const [customSets, setCustomSets] = useState<number>(3);
  const [customReps, setCustomReps] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [substitutedExercise, setSubstitutedExercise] = useState<{ name: string; videoUrl?: string } | null>(null);

  // Queries
  // 1. Workout Days of the plan
  const daysRef = useMemoFirebase(() => {
    if (!firestore || !planId) return null;
    return query(collection(firestore, 'trainingPlans', planId, 'workoutDays'), orderBy('dayOrder', 'asc'));
  }, [firestore, planId]);
  const { data: days, isLoading: loadingDays } = useCollection<any>(daysRef);

  // Set default active day tab once loaded
  useEffect(() => {
    if (days && days.length > 0 && !activeDayId) {
      setActiveDayId(days[0].id);
    }
  }, [days, activeDayId]);

  // 2. Athlete Limitations
  const limitationsRef = useMemoFirebase(() => {
    if (!firestore || !athleteId) return null;
    return query(collection(firestore, 'userProfiles', athleteId, 'limitations'), orderBy('createdAt', 'desc'));
  }, [firestore, athleteId]);
  const { data: limitations } = useCollection<any>(limitationsRef);

  // 3. Exercise Adaptations
  const adaptationsRef = useMemoFirebase(() => {
    if (!firestore || !athleteId) return null;
    return query(collection(firestore, 'userProfiles', athleteId, 'adaptations'), where('planId', '==', planId));
  }, [firestore, athleteId, planId]);
  const { data: adaptationsRaw } = useCollection<any>(adaptationsRef);

  // Convert adaptations list to a dictionary keyed by `${dayId}_${exerciseIndex}`
  const adaptations = React.useMemo(() => {
    const map: Record<string, any> = {};
    if (adaptationsRaw) {
      adaptationsRaw.forEach((ad: any) => {
        map[`${ad.dayId}_${ad.exerciseIndex}`] = ad;
      });
    }
    return map;
  }, [adaptationsRaw]);

  // 4. Exercises Library (for substitution)
  const exercisesLibRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'exercises'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: libraryExercises } = useCollection<any>(exercisesLibRef);
  const [searchTerm, setSearchTerm] = useState('');

  // Find if a particular exercise matches any athlete limitation
  const getLimitationForExercise = (exerciseName: string) => {
    if (!limitations) return null;
    const lowerName = exerciseName.toLowerCase();
    
    // Filter out expired temporary limitations
    const activeLimitations = limitations.filter((lim: any) => {
      if (lim.type === 'temporary') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recDate = new Date(lim.recoveryDate);
        recDate.setHours(23, 59, 59, 999);
        return recDate >= today;
      }
      return true;
    });

    return activeLimitations.find((lim: any) => {
      // Direct substring match on description
      if (lowerName.includes(lim.description.toLowerCase())) return true;
      // Keywords matches
      if (lim.affectedKeywords?.some((k: string) => lowerName.includes(k))) return true;
      return false;
    });
  };

  // Open customization dialog
  const handleOpenCustomize = (dayId: string, ex: any, index: number) => {
    const existingAdaptation = adaptations[`${dayId}_${index}`];
    
    setCustomizingExercise({ dayId, ex, index });
    setIsExcluded(existingAdaptation?.isDeleted || false);
    setCustomSets(existingAdaptation?.sets ?? (ex.sets || 3));
    setCustomReps(existingAdaptation?.reps ?? (ex.reps || '10'));
    setCustomNotes(existingAdaptation?.notes ?? '');
    
    if (existingAdaptation?.substitutedExerciseName) {
      setSubstitutedExercise({
        name: existingAdaptation.substitutedExerciseName,
        videoUrl: existingAdaptation.substitutedVideoUrl || '',
      });
    } else {
      setSubstitutedExercise(null);
    }
    
    setIsCustomizingOpen(true);
  };

  // Save customization to Firestore
  const handleSaveCustomization = async () => {
    if (!firestore || !athleteId || !customizingExercise) return;
    
    const { dayId, ex, index } = customizingExercise;
    const docId = `${planId}_${dayId}_${index}`;
    const adaptationRef = doc(firestore, 'userProfiles', athleteId, 'adaptations', docId);

    try {
      if (isExcluded) {
        // Exclude exercise
        await setDoc(adaptationRef, {
          planId,
          dayId,
          exerciseIndex: index,
          originalExerciseName: ex.exerciseName || '',
          action: 'delete',
          isDeleted: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Save adaptations (edit/adapt/substitute)
        await setDoc(adaptationRef, {
          planId,
          dayId,
          exerciseIndex: index,
          originalExerciseName: ex.exerciseName || '',
          action: substitutedExercise ? 'substitute' : 'customize',
          isDeleted: false,
          sets: customSets,
          reps: customReps,
          notes: customNotes,
          substitutedExerciseName: substitutedExercise?.name || null,
          substitutedVideoUrl: substitutedExercise?.videoUrl || null,
          updatedAt: serverTimestamp(),
        });
      }

      toast({
        title: 'Exercício Adaptado',
        description: 'As alterações foram salvas para este aluno.',
      });
      setIsCustomizingOpen(false);
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  // Remove adaptation (restore template defaults)
  const handleRestoreDefault = async (dayId: string, index: number) => {
    if (!firestore || !athleteId) return;
    const docId = `${planId}_${dayId}_${index}`;
    try {
      await deleteDoc(doc(firestore, 'userProfiles', athleteId, 'adaptations', docId));
      toast({
        title: 'Exercício Restaurado',
        description: 'Restaurado para os valores padrões da ficha original.',
      });
    } catch (e: any) {
      toast({
        title: 'Erro ao restaurar',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  const filteredExercises = libraryExercises?.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10">
              <Settings className="w-3.5 h-3.5 mr-1" /> Adaptar Exercícios
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col h-full bg-background p-0">
          <div className="p-6 border-b border-border/40 shrink-0">
            <SheetHeader>
              <SheetTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-primary" />
                Adaptar Exercícios do Aluno
              </SheetTitle>
              <SheetDescription>
                Personalize repetições, exclua ou substitua exercícios da ficha <strong>{planName}</strong> especificamente para este aluno.
              </SheetDescription>
            </SheetHeader>
          </div>

          {loadingDays ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Carregando estrutura de dias...</p>
            </div>
          ) : days && days.length > 0 ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Day Selection Tabs */}
              <Tabs value={activeDayId} onValueChange={setActiveDayId} className="flex-1 flex flex-col min-h-0">
                <div className="px-6 border-b border-border/20 shrink-0 bg-muted/20 py-2">
                  <TabsList className="w-full justify-start overflow-x-auto bg-transparent h-auto gap-2 p-0">
                    {days.map((day: any) => (
                      <TabsTrigger 
                        key={day.id} 
                        value={day.id}
                        className={cn(
                          "px-4 py-2 border-b-2 rounded-none border-transparent text-muted-foreground bg-transparent font-medium hover:text-foreground",
                          "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:bg-primary/5"
                        )}
                      >
                        {day.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="flex-1 min-h-0">
                  {days.map((day: any) => (
                    <TabsContent key={day.id} value={day.id} className="h-full mt-0 focus-visible:outline-none focus-visible:ring-0">
                      <ScrollArea className="h-full p-6">
                        <div className="space-y-4 pb-12">
                          {day.exercises?.map((ex: any, idx: number) => {
                            const adaptation = adaptations[`${day.id}_${idx}`];
                            const limitation = getLimitationForExercise(ex.exerciseName);
                            
                            // Determine visual values based on template vs customization
                            const displayName = adaptation?.substitutedExerciseName || ex.exerciseName;
                            const displaySets = adaptation?.sets ?? ex.sets;
                            const displayReps = adaptation?.reps ?? ex.reps;
                            const isDel = adaptation?.isDeleted || false;
                            
                            return (
                              <Card key={idx} className={cn(
                                "border transition-all relative overflow-hidden",
                                isDel ? "bg-muted/40 border-muted opacity-60" : 
                                adaptation ? "bg-primary/5 border-primary/20" : "bg-card/40 border-primary/5"
                              )}>
                                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    <Badge variant="outline" className={cn(
                                      "h-7 w-7 rounded-full flex items-center justify-center p-0 text-xs shrink-0 font-bold",
                                      isDel ? "bg-muted text-muted-foreground" :
                                      adaptation ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"
                                    )}>
                                      {idx + 1}
                                    </Badge>
                                    
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className={cn("font-bold text-base leading-tight", isDel && "line-through text-muted-foreground")}>
                                          {displayName}
                                        </h4>
                                        {isDel && (
                                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">Excluído</Badge>
                                        )}
                                        {adaptation && !isDel && (
                                          <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-primary text-primary-foreground">
                                            {adaptation.action === 'substitute' ? 'Substituído' : 'Personalizado'}
                                          </Badge>
                                        )}
                                      </div>

                                      {!isDel && (
                                        <p className="text-xs text-muted-foreground">
                                          Séries: <span className="font-semibold text-foreground font-mono">{displaySets}</span> • Reps: <span className="font-semibold text-foreground font-mono">{displayReps}</span>
                                        </p>
                                      )}

                                      {/* Adaptation Notes */}
                                      {adaptation?.notes && !isDel && (
                                        <p className="text-xs bg-primary/10 border border-primary/10 p-2 rounded text-primary-foreground font-medium mt-1 dark:text-primary">
                                          <span className="font-bold text-[10px] uppercase block tracking-wider opacity-85">Adaptação do Prof:</span>
                                          {adaptation.notes}
                                        </p>
                                      )}

                                      {/* Limitation Clinical Warning */}
                                      {limitation && !isDel && (
                                        <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 border border-red-500/10 p-2 rounded mt-1.5 font-medium animate-pulse">
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                          <span>
                                            Restrição clínica: <strong>{limitation.description}</strong>
                                            {limitation.type === 'temporary' && ` (Recup: ${new Date(limitation.recoveryDate).toLocaleDateString('pt-BR')})`}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleOpenCustomize(day.id, ex, idx)}
                                      className="h-8 border-border hover:bg-muted/50 text-xs"
                                    >
                                      <Edit className="w-3.5 h-3.5 mr-1" /> Customizar
                                    </Button>

                                    {adaptation && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        title="Restaurar padrão"
                                        onClick={() => handleRestoreDefault(day.id, idx)}
                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <Dumbbell className="w-12 h-12 mb-4 opacity-30" />
              <p>Esta ficha de treino não possui nenhum exercício.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Customize Exercise Modal */}
      <Dialog open={isCustomizingOpen} onOpenChange={setIsCustomizingOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Personalizar Exercício
            </DialogTitle>
            <DialogDescription>
              Defina as adaptações do exercício para este aluno.
            </DialogDescription>
          </DialogHeader>

          {customizingExercise && (
            <div className="space-y-4 pt-3">
              {/* Clinical limitation alert in editor */}
              {getLimitationForExercise(substitutedExercise?.name || customizingExercise.ex.exerciseName) && (
                <div className="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Aviso de Restrição Clínica</p>
                    <p className="text-xs text-red-400">
                      O aluno possui a seguinte limitação: <strong>{getLimitationForExercise(substitutedExercise?.name || customizingExercise.ex.exerciseName)?.description}</strong>.
                      Evite cargas elevadas ou substitua por um equivalente mais seguro.
                    </p>
                  </div>
                </div>
              )}

              {/* Exclusion toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="exclude" className="font-semibold text-sm cursor-pointer">Excluir Exercício</Label>
                  <p className="text-xs text-muted-foreground">Ocultar este exercício da ficha do aluno</p>
                </div>
                <input
                  id="exclude"
                  type="checkbox"
                  checked={isExcluded}
                  onChange={(e) => setIsExcluded(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </div>

              {!isExcluded && (
                <>
                  {/* Substitution Section */}
                  <div className="space-y-2">
                    <Label>Substituir por Exercício Equivalente</Label>
                    {substitutedExercise ? (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-primary" />
                          <span className="font-bold text-sm">{substitutedExercise.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setSubstitutedExercise(null)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Popover open={isSelectExerciseOpen} onOpenChange={setIsSelectExerciseOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between text-left text-xs h-10 border-dashed">
                            <span>Selecionar exercício equivalente...</span>
                            <Search className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-80 shadow-2xl border-primary/10 bg-popover overflow-hidden" align="start">
                          <div className="p-3 border-b border-border/30 flex items-center gap-2 bg-muted/20">
                            <Search className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                            <Input 
                              placeholder="Pesquisar na biblioteca..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="h-8 text-xs bg-transparent border-none focus-visible:ring-0 p-0 focus-visible:ring-offset-0"
                            />
                          </div>
                          <ScrollArea className="h-48">
                            <div className="p-2 space-y-1">
                              {filteredExercises.map((libEx: any) => (
                                <Button
                                  key={libEx.id}
                                  variant="ghost"
                                  className="w-full justify-start font-normal text-xs py-1.5 px-3 hover:bg-primary/10 hover:text-primary transition-colors flex flex-col items-start gap-0.5"
                                  onClick={() => {
                                    setSubstitutedExercise({
                                      name: libEx.name,
                                      videoUrl: libEx.videoUrl || '',
                                    });
                                    setIsSelectExerciseOpen(false);
                                  }}
                                >
                                  <span className="font-semibold">{libEx.name}</span>
                                  {libEx.muscleGroup && (
                                    <span className="text-[9px] opacity-60 uppercase">{libEx.muscleGroup}</span>
                                  )}
                                </Button>
                              ))}
                              {filteredExercises.length === 0 && (
                                <p className="text-xs text-center p-4 text-muted-foreground">Nenhum exercício encontrado</p>
                              )}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Sets and Reps */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="sets">Séries</Label>
                      <Input
                        id="sets"
                        type="number"
                        min="1"
                        value={customSets}
                        onChange={(e) => setCustomSets(parseInt(e.target.value) || 3)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reps">Repetições</Label>
                      <Input
                        id="reps"
                        value={customReps}
                        onChange={(e) => setCustomReps(e.target.value)}
                        placeholder="Ex: 10 a 12"
                      />
                    </div>
                  </div>

                  {/* Adaptation Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Orientação Especial / Notas de Adaptação</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      placeholder="Ex: Cuidado com a amplitude. Focar na contração lenta."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCustomizingOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveCustomization} className="bg-primary text-primary-foreground">
                  Confirmar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
