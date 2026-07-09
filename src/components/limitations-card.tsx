'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Activity, Plus, Trash2, Calendar, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LimitationsCardProps {
  athleteId: string;
}

export function LimitationsCard({ athleteId }: LimitationsCardProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [affectedExercises, setAffectedExercises] = useState('');
  const [type, setType] = useState<'permanent' | 'temporary'>('temporary');
  const [recoveryDate, setRecoveryDate] = useState('');

  // Fetch limitations
  const limitationsRef = useMemoFirebase(() => {
    if (!firestore || !athleteId) return null;
    return query(
      collection(firestore, 'userProfiles', athleteId, 'limitations'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, athleteId]);

  const { data: limitations, isLoading } = useCollection<any>(limitationsRef);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !athleteId) return;

    if (!description.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Por favor, descreva a comorbidade ou limitação.',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'temporary' && !recoveryDate) {
      toast({
        title: 'Data de recuperação obrigatória',
        description: 'Por favor, defina a data prevista de recuperação.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const keywords = affectedExercises
        ? affectedExercises.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean)
        : [];

      await addDoc(collection(firestore, 'userProfiles', athleteId, 'limitations'), {
        description: description.trim(),
        rawAffectedExercises: affectedExercises.trim(),
        affectedKeywords: keywords,
        type,
        recoveryDate: type === 'temporary' ? recoveryDate : null,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Limitação Adicionada',
        description: 'A restrição física foi registrada para este aluno.',
      });

      // Reset form
      setDescription('');
      setAffectedExercises('');
      setType('temporary');
      setRecoveryDate('');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error adding limitation:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao registrar a limitação.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (limitationId: string) => {
    if (!firestore || !athleteId) return;
    try {
      await deleteDoc(doc(firestore, 'userProfiles', athleteId, 'limitations', limitationId));
      toast({
        title: 'Limitação Removida',
        description: 'A restrição foi excluída do histórico do aluno.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recDate = new Date(dateStr);
    recDate.setHours(23, 59, 59, 999); // Allow the recovery day itself to be active
    return recDate < today;
  };

  return (
    <Card className="border-red-500/20 bg-red-500/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <CardTitle className="text-lg">Comorbidades & Limitações Clínicas</CardTitle>
              <CardDescription>Restrições físicas e lesões registradas para o aluno</CardDescription>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Limitação / Comorbidade</DialogTitle>
                <DialogDescription>
                  Adicione detalhes sobre lesões ou condições de saúde que afetam os treinos.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="desc">Descrição da Limitação / Lesão</Label>
                  <Input
                    id="desc"
                    placeholder="Ex: Condromalácia Patelar Grau II, Lesão no Manguito"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercises">Exercícios / Grupos Afetados (Separados por vírgula)</Label>
                  <Input
                    id="exercises"
                    placeholder="Ex: Agachamento, Leg Press, Flexão, Ombros"
                    value={affectedExercises}
                    onChange={(e) => setAffectedExercises(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    O sistema irá alertar se o treino contiver palavras chaves correspondentes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={type}
                      onValueChange={(val: 'permanent' | 'temporary') => setType(val)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temporary">Temporária</SelectItem>
                        <SelectItem value="permanent">Permanente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {type === 'temporary' && (
                    <div className="space-y-2">
                      <Label htmlFor="recovery">Data de Recuperação</Label>
                      <Input
                        id="recovery"
                        type="date"
                        value={recoveryDate}
                        onChange={(e) => setRecoveryDate(e.target.value)}
                        required={type === 'temporary'}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
                    {saving ? 'Salvando...' : 'Salvar Restrição'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-10 animate-pulse bg-muted rounded" />
        ) : limitations && limitations.length > 0 ? (
          <div className="space-y-3">
            {limitations.map((lim: any) => {
              const expired = lim.type === 'temporary' && isExpired(lim.recoveryDate);
              return (
                <div
                  key={lim.id}
                  className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${
                    expired
                      ? 'bg-muted/30 border-muted text-muted-foreground'
                      : 'bg-background/80 border-red-200/50 shadow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{lim.description}</span>
                      {lim.type === 'permanent' ? (
                        <Badge variant="destructive" className="text-[10px] h-4 py-0 px-1">
                          Permanente
                        </Badge>
                      ) : expired ? (
                        <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 gap-1 border-green-500/30 text-green-600 bg-green-50">
                          <CheckCircle className="w-2.5 h-2.5" /> Recuperado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1 gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                          <Clock className="w-2.5 h-2.5" /> Até {new Date(lim.recoveryDate).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                    </div>
                    {lim.rawAffectedExercises && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-red-500/80">Evitar:</span> {lim.rawAffectedExercises}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(lim.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            Nenhuma comorbidade ou restrição física registrada para este aluno.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
