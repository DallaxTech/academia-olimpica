'use client';

import React, { useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, Plus, Trash2, Calendar, Scale, 
  Flame, Droplet, Dumbbell, ArrowLeft, Loader2, Sparkles, TrendingUp
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BioimpedanceSheetProps {
  athleteId: string;
  athleteName: string;
  trigger?: React.ReactNode;
}

export function BioimpedanceSheet({ athleteId, athleteName, trigger }: BioimpedanceSheetProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [view, setView] = useState<'list' | 'add'>('list');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    bodyFat: '',
    muscleMass: '',
    visceralFat: '',
    water: '',
    bmr: '',
    boneMass: '',
  });

  // Query for previous bioimpedance records
  const bioRef = useMemoFirebase(() => {
    if (!firestore || !athleteId) return null;
    return query(
      collection(firestore, 'userProfiles', athleteId, 'bioimpedance'),
      orderBy('date', 'desc')
    );
  }, [firestore, athleteId]);

  const { data: records, isLoading } = useCollection<any>(bioRef);

  const handleResetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      height: '',
      bodyFat: '',
      muscleMass: '',
      visceralFat: '',
      water: '',
      bmr: '',
      boneMass: '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !athleteId) return;

    if (!formData.weight) {
      toast({
        title: 'Peso obrigatório',
        description: 'Por favor, insira o peso corporal.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Parse inputs as numbers or null
      const parsedData = {
        date: formData.date,
        weight: parseFloat(formData.weight),
        height: formData.height ? parseFloat(formData.height) : null,
        bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
        muscleMass: formData.muscleMass ? parseFloat(formData.muscleMass) : null,
        visceralFat: formData.visceralFat ? parseInt(formData.visceralFat) : null,
        water: formData.water ? parseFloat(formData.water) : null,
        bmr: formData.bmr ? parseInt(formData.bmr) : null,
        boneMass: formData.boneMass ? parseFloat(formData.boneMass) : null,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'userProfiles', athleteId, 'bioimpedance'), parsedData);
      toast({
        title: 'Sucesso',
        description: 'Dados de bioimpedância cadastrados com sucesso!',
      });
      handleResetForm();
      setView('list');
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erro ao salvar',
        description: e.message || 'Ocorreu um erro ao salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !athleteId) return;
    if (!confirm('Deseja realmente excluir este registro de bioimpedância?')) return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(firestore, 'userProfiles', athleteId, 'bioimpedance', id));
      toast({
        title: 'Registro Excluído',
        description: 'A avaliação foi excluída com sucesso.',
      });
    } catch (e: any) {
      toast({
        title: 'Erro ao excluir',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const latestRecord = records && records.length > 0 ? records[0] : null;

  return (
    <Sheet onOpenChange={(open) => { if (!open) { setView('list'); handleResetForm(); } }}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 border-primary/20 hover:border-primary/50 transition-colors">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Bioimpedância
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full bg-background/95 backdrop-blur-md border-l border-border p-0">
        
        {view === 'list' ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b bg-muted/20">
              <SheetHeader className="text-left flex flex-row items-center justify-between space-y-0">
                <div>
                  <SheetTitle className="text-xl flex items-center gap-2 font-bold">
                    <Activity className="w-5 h-5 text-primary animate-pulse" />
                    Bioimpedância
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Avaliações corporais de {athleteName}
                  </SheetDescription>
                </div>
                <Button size="sm" className="gap-1 shadow-sm" onClick={() => setView('add')}>
                  <Plus className="w-4 h-4" /> Novo
                </Button>
              </SheetHeader>
            </div>

            {/* Content list */}
            <ScrollArea className="flex-1 p-6">
              {isLoading ? (
                <div className="flex flex-col gap-4 py-8 items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Carregando avaliações...</p>
                </div>
              ) : records && records.length > 0 ? (
                <div className="space-y-6">
                  {/* Latest Record Highlight Card */}
                  {latestRecord && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-yellow-500" /> Último Registro ({new Date(latestRecord.date + 'T00:00:00').toLocaleDateString('pt-BR')})
                      </h4>
                      <Card className="overflow-hidden border-primary/20 bg-primary/[0.02] shadow-sm">
                        <CardContent className="p-5">
                          {/* Weight & Body Fat Headline */}
                          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/60">
                            <div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Scale className="w-3 h-3 text-primary" /> Peso Corporal
                              </p>
                              <p className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                                {latestRecord.weight} <span className="text-sm font-medium text-muted-foreground">kg</span>
                              </p>
                            </div>
                            {latestRecord.bodyFat !== null && (
                              <div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-red-500" /> Gordura Corporal
                                </p>
                                <p className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
                                  {latestRecord.bodyFat}%
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Grid of details */}
                          <div className="grid grid-cols-2 gap-y-4 gap-x-4 pt-4 text-sm">
                            {latestRecord.muscleMass !== null && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Dumbbell className="w-3 h-3 text-indigo-500" /> Massa Muscular
                                </span>
                                <span className="font-semibold text-foreground">{latestRecord.muscleMass} kg</span>
                              </div>
                            )}
                            {latestRecord.water !== null && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Droplet className="w-3 h-3 text-blue-500" /> Água Corporal
                                </span>
                                <span className="font-semibold text-foreground">{latestRecord.water}%</span>
                              </div>
                            )}
                            {latestRecord.visceralFat !== null && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-muted-foreground">Gordura Visceral</span>
                                <span className="font-semibold text-foreground">Nível {latestRecord.visceralFat}</span>
                              </div>
                            )}
                            {latestRecord.bmr !== null && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-orange-500" /> Taxa Metabólica (TMB)
                                </span>
                                <span className="font-semibold text-foreground">{latestRecord.bmr} kcal</span>
                              </div>
                            )}
                            {latestRecord.boneMass !== null && (
                              <div className="flex flex-col gap-0.5 col-span-2">
                                <span className="text-xs text-muted-foreground">Massa Óssea</span>
                                <span className="font-semibold text-foreground">{latestRecord.boneMass} kg</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* History List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Histórico de Avaliações ({records.length})</h4>
                    <div className="space-y-3">
                      {records.map((rec: any, idx: number) => (
                        <div key={rec.id} className="p-4 border rounded-xl bg-card hover:bg-card/80 transition-colors flex items-center justify-between group">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-bold text-sm">
                                {new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </span>
                              {idx === 0 && (
                                <Badge variant="secondary" className="text-[9px] py-0 px-1 font-semibold bg-primary/10 text-primary border-none">
                                  Última
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span>Peso: <strong>{rec.weight} kg</strong></span>
                              {rec.bodyFat !== null && (
                                <span>Gordura: <strong>{rec.bodyFat}%</strong></span>
                              )}
                              {rec.muscleMass !== null && (
                                <span>Músculo: <strong>{rec.muscleMass} kg</strong></span>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => handleDelete(rec.id)}
                            disabled={deletingId === rec.id}
                          >
                            {deletingId === rec.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-2xl p-6 bg-muted/10">
                  <Activity className="w-10 h-10 text-muted-foreground/60 mb-3" />
                  <p className="font-semibold text-muted-foreground text-sm">Nenhuma avaliação encontrada</p>
                  <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs">
                    Cadastre a primeira avaliação de bioimpedância para começar a acompanhar a evolução deste aluno.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setView('add')}>
                    <Plus className="w-4 h-4 mr-1.5" /> Adicionar Avaliação
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <Button type="button" variant="ghost" size="sm" className="h-8 p-0 pr-2 hover:bg-transparent" onClick={() => setView('list')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
              </div>
              <SheetHeader className="text-left space-y-0">
                <SheetTitle className="text-lg font-bold">Nova Avaliação Corporal</SheetTitle>
                <SheetDescription className="text-xs">
                  Insira os resultados da avaliação de bioimpedância de {athleteName}.
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* Inputs scroll area */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 pb-6">
                
                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="date">Data da Avaliação</Label>
                  <Input 
                    type="date" 
                    id="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Grid of main parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="weight">Peso (kg) *</Label>
                    <Input 
                      type="number" 
                      step="any" 
                      id="weight" 
                      placeholder="Ex: 78.5" 
                      value={formData.weight} 
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input 
                      type="number" 
                      step="any" 
                      id="height" 
                      placeholder="Ex: 175" 
                      value={formData.height} 
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bodyFat">Gordura Corporal (%)</Label>
                    <Input 
                      type="number" 
                      step="any" 
                      id="bodyFat" 
                      placeholder="Ex: 14.5" 
                      value={formData.bodyFat} 
                      onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
                    <Input 
                      type="number" 
                      step="any" 
                      id="muscleMass" 
                      placeholder="Ex: 38.2" 
                      value={formData.muscleMass} 
                      onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="visceralFat">Gordura Visceral (Nível)</Label>
                    <Input 
                      type="number" 
                      step="1" 
                      id="visceralFat" 
                      placeholder="Ex: 4" 
                      value={formData.visceralFat} 
                      onChange={(e) => setFormData({ ...formData, visceralFat: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="water">Água Corporal (%)</Label>
                    <Input 
                      type="number" 
                      step="any" 
                      id="water" 
                      placeholder="Ex: 58.2" 
                      value={formData.water} 
                      onChange={(e) => setFormData({ ...formData, water: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bmr">Metabolismo Basal (kcal)</Label>
                    <Input 
                      type="number" 
                      step="1" 
                      id="bmr" 
                      placeholder="Ex: 1820" 
                      value={formData.bmr} 
                      onChange={(e) => setFormData({ ...formData, bmr: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="boneMass">Massa Óssea (kg)</Label>
                    <Input 
                      type="number" 
                      step="any" 
                      id="boneMass" 
                      placeholder="Ex: 3.2" 
                      value={formData.boneMass} 
                      onChange={(e) => setFormData({ ...formData, boneMass: e.target.value })}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground italic mt-2">
                  * Campos marcados com asterisco são obrigatórios.
                </p>

              </div>
            </ScrollArea>

            {/* Footer with submit */}
            <div className="p-6 border-t bg-muted/10 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setView('list')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Salvar Registro'
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
