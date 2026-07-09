'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Role, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  Search,
  Plus,
  Trash2,
  Calendar,
  Scale,
  Flame,
  Droplet,
  Dumbbell,
  Loader2,
  Sparkles,
  TrendingUp,
  User as UserIcon,
  ChevronRight,
  Sparkle
} from 'lucide-react';

export default function BioimpedanceDashboardPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  // Search and selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'add'>('history');
  
  // Form states
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  // Query for all users (athletes)
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'userProfiles');
  }, [firestore]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersCollectionRef);

  // Filter users to only include Athletes matching search query
  const athletes = React.useMemo(() => {
    if (!users) return [];
    
    // Filter by role Athlete
    const onlyAthletes = users.filter(user => user.roleId === Role.Athlete);
    
    if (!searchQuery.trim()) return onlyAthletes;
    
    const queryLower = searchQuery.toLowerCase();
    return onlyAthletes.filter(athlete => {
      const fullName = `${athlete.firstName || ''} ${athlete.lastName || ''}`.toLowerCase();
      const email = (athlete.email || '').toLowerCase();
      return fullName.includes(queryLower) || email.includes(queryLower);
    });
  }, [users, searchQuery]);

  // Query for selected athlete's bioimpedance records
  const bioRef = useMemoFirebase(() => {
    if (!firestore || !selectedAthlete) return null;
    return query(
      collection(firestore, 'userProfiles', selectedAthlete.id, 'bioimpedance'),
      orderBy('date', 'desc')
    );
  }, [firestore, selectedAthlete]);

  const { data: records, isLoading: isLoadingRecords } = useCollection<any>(bioRef);

  // Auto-select the first athlete if none selected and athletes are loaded
  useEffect(() => {
    if (!selectedAthlete && athletes.length > 0) {
      setSelectedAthlete(athletes[0]);
    }
  }, [athletes, selectedAthlete]);

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

  const handleSelectAthlete = (athlete: UserProfile) => {
    setSelectedAthlete(athlete);
    setActiveTab('history');
    handleResetForm();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selectedAthlete) return;

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

      await addDoc(collection(firestore, 'userProfiles', selectedAthlete.id, 'bioimpedance'), parsedData);
      toast({
        title: 'Sucesso',
        description: 'Dados de bioimpedância cadastrados com sucesso!',
      });
      handleResetForm();
      setActiveTab('history');
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Ocorreu um erro ao salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !selectedAthlete) return;
    if (!confirm('Deseja realmente excluir este registro de bioimpedância?')) return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(firestore, 'userProfiles', selectedAthlete.id, 'bioimpedance', id));
      toast({
        title: 'Registro Excluído',
        description: 'A avaliação foi excluída com sucesso.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const latestRecord = records && records.length > 0 ? records[0] : null;

  return (
    <div className="flex flex-col h-full space-y-6">
      <PageHeader
        title="Painel de Bioimpedância"
        description="Pesquise alunos e gerencie o histórico de avaliações corporais e bioimpedância de forma centralizada."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-12rem)] min-h-[500px]">
        
        {/* Left Column - Athlete List & Search */}
        <Card className="lg:col-span-4 h-full flex flex-col overflow-hidden border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" /> Alunos ({athletes.length})
            </CardTitle>
            <CardDescription className="text-xs">Selecione um aluno para ver os dados</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar aluno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto divide-y divide-border/60">
            {isLoadingUsers ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))
            ) : athletes.length > 0 ? (
              athletes.map((athlete) => {
                const isSelected = selectedAthlete?.id === athlete.id;
                return (
                  <button
                    key={athlete.id}
                    onClick={() => handleSelectAthlete(athlete)}
                    className={`w-full text-left p-3.5 flex items-center justify-between transition-all hover:bg-muted/40 ${
                      isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 border border-border/80">
                        <AvatarImage src={`https://avatar.vercel.sh/${athlete.email}.png`} alt={`${athlete.firstName} ${athlete.lastName}`} />
                        <AvatarFallback><UserIcon className="h-4.5 w-4.5 text-muted-foreground" /></AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {athlete.firstName} {athlete.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{athlete.email}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground/60 transition-transform ${isSelected ? 'translate-x-0.5 text-primary' : ''}`} />
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <UserIcon className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm">Nenhum aluno encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Athlete Bioimpedance Panel */}
        <Card className="lg:col-span-8 h-full flex flex-col overflow-hidden border-border bg-card/60 backdrop-blur-sm">
          {selectedAthlete ? (
            <div className="flex flex-col h-full">
              {/* Active Athlete Header */}
              <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarImage src={`https://avatar.vercel.sh/${selectedAthlete.email}.png`} />
                    <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {selectedAthlete.firstName} {selectedAthlete.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{selectedAthlete.email}</p>
                  </div>
                </div>

                {/* Tab switchers */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <Button
                    variant={activeTab === 'history' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('history')}
                    className="h-8 text-xs font-semibold"
                  >
                    Histórico
                  </Button>
                  <Button
                    variant={activeTab === 'add' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('add')}
                    className="h-8 text-xs font-semibold gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Avaliar
                  </Button>
                </div>
              </div>

              {/* Tab Content Areas */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'history' ? (
                  isLoadingRecords ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                    </div>
                  ) : records && records.length > 0 ? (
                    <div className="space-y-6">
                      
                      {/* Highlighted Card */}
                      {latestRecord && (
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" /> Última Avaliação ({new Date(latestRecord.date + 'T00:00:00').toLocaleDateString('pt-BR')})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            {/* Weight */}
                            <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-primary" /> Peso Corporal
                                  </span>
                                  <p className="text-2xl font-extrabold text-foreground">
                                    {latestRecord.weight} <span className="text-xs font-normal text-muted-foreground">kg</span>
                                  </p>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Body Fat */}
                            {latestRecord.bodyFat !== null && (
                              <Card className="border-red-500/20 bg-red-500/[0.02] shadow-sm">
                                <CardContent className="p-4 flex items-center justify-between">
                                  <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <TrendingUp className="w-3.5 h-3.5 text-red-500" /> Gordura Corporal
                                    </span>
                                    <p className="text-2xl font-extrabold text-foreground">
                                      {latestRecord.bodyFat}%
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Muscle Mass */}
                            {latestRecord.muscleMass !== null && (
                              <Card className="border-indigo-500/20 bg-indigo-500/[0.02] shadow-sm">
                                <CardContent className="p-4 flex items-center justify-between">
                                  <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Dumbbell className="w-3.5 h-3.5 text-indigo-500" /> Massa Muscular
                                    </span>
                                    <p className="text-2xl font-extrabold text-foreground">
                                      {latestRecord.muscleMass} <span className="text-xs font-normal text-muted-foreground">kg</span>
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>

                          {/* Secondary Metrics details grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/40">
                            {latestRecord.height !== null && (
                              <div className="bg-muted/10 p-3 rounded-lg border">
                                <span className="text-[11px] text-muted-foreground block">Altura</span>
                                <span className="text-sm font-semibold">{latestRecord.height} cm</span>
                              </div>
                            )}
                            {latestRecord.water !== null && (
                              <div className="bg-muted/10 p-3 rounded-lg border">
                                <span className="text-[11px] text-muted-foreground block flex items-center gap-1">
                                  <Droplet className="w-3 h-3 text-blue-500" /> Água Corporal
                                </span>
                                <span className="text-sm font-semibold">{latestRecord.water}%</span>
                              </div>
                            )}
                            {latestRecord.visceralFat !== null && (
                              <div className="bg-muted/10 p-3 rounded-lg border">
                                <span className="text-[11px] text-muted-foreground block">Gordura Visceral</span>
                                <span className="text-sm font-semibold">Nível {latestRecord.visceralFat}</span>
                              </div>
                            )}
                            {latestRecord.bmr !== null && (
                              <div className="bg-muted/10 p-3 rounded-lg border">
                                <span className="text-[11px] text-muted-foreground block flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-orange-500" /> TMB Basal
                                </span>
                                <span className="text-sm font-semibold">{latestRecord.bmr} kcal</span>
                              </div>
                            )}
                            {latestRecord.boneMass !== null && (
                              <div className="bg-muted/10 p-3 rounded-lg border col-span-2">
                                <span className="text-[11px] text-muted-foreground block">Massa Óssea</span>
                                <span className="text-sm font-semibold">{latestRecord.boneMass} kg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Complete timeline list */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Histórico Geral ({records.length})
                        </h4>
                        <div className="grid gap-3">
                          {records.map((rec: any, index: number) => (
                            <div
                              key={rec.id}
                              className="p-4 border rounded-xl bg-card hover:bg-card/85 transition-colors flex items-center justify-between group"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="font-bold text-sm">
                                    {new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                  </span>
                                  {index === 0 && (
                                    <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-semibold bg-primary/10 text-primary border-none">
                                      Última
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                  <span>Peso: <strong className="text-foreground">{rec.weight} kg</strong></span>
                                  {rec.bodyFat !== null && (
                                    <span>Gordura: <strong className="text-foreground">{rec.bodyFat}%</strong></span>
                                  )}
                                  {rec.muscleMass !== null && (
                                    <span>Músculo: <strong className="text-foreground">{rec.muscleMass} kg</strong></span>
                                  )}
                                  {rec.height !== null && (
                                    <span>Altura: <strong className="text-foreground">{rec.height} cm</strong></span>
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
                                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
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
                      <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm">
                        Cadastre a primeira avaliação corporal de bioimpedância para este aluno para começar o acompanhamento.
                      </p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('add')}>
                        <Plus className="w-4 h-4 mr-1.5" /> Adicionar Avaliação
                      </Button>
                    </div>
                  )
                ) : (
                  /* Form configuration fields */
                  <form onSubmit={handleSave} className="space-y-4 max-w-xl pb-6">
                    <div className="border-b pb-3 mb-4">
                      <h4 className="text-sm font-bold text-foreground">Nova Avaliação Corporal</h4>
                      <p className="text-xs text-muted-foreground">Insira as novas medições para {selectedAthlete.firstName}</p>
                    </div>

                    {/* Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      <div className="space-y-1.5">
                        <Label htmlFor="weight">Peso Corporal (kg) *</Label>
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <p className="text-[11px] text-muted-foreground italic">
                      * Campos marcados com asterisco são obrigatórios.
                    </p>

                    <div className="flex items-center gap-3 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab('history')}
                        disabled={saving}
                      >
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
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 flex-1">
              <Activity className="w-12 h-12 text-muted-foreground/40 mb-4 animate-pulse" />
              <h3 className="font-bold text-lg text-muted-foreground">Nenhum Aluno Selecionado</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Selecione um aluno na barra lateral esquerda para visualizar o histórico de bioimpedância ou registrar novas avaliações.
              </p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
