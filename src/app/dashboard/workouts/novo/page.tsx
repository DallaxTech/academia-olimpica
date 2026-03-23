'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, Save, Trash2, GripVertical } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

export default function WorkoutBuilder() {
  const router = useRouter();
  const { toast } = useToast();
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [exercises, setExercises] = useState([
    { id: '1', name: 'Supino Reto', sets: 4, reps: '10' }
  ]);

  const addExercise = () => {
    setExercises([...exercises, { id: Date.now().toString(), name: '', sets: 3, reps: '12' }]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const updateExercise = (id: string, field: string, value: string | number) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const handleSave = () => {
    if (!workoutTitle.trim()) {
      toast({ title: 'Erro', description: 'Dê um nome para a ficha.', variant: 'destructive' });
      return;
    }
    // Implementar salvamento no Firebase Firestore
    toast({ title: 'Sucesso!', description: 'Ficha salva na biblioteca.' });
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Construtor de Treino</h1>
          <p className="text-muted-foreground">Crie uma nova ficha "Arrastar e Soltar"</p>
        </div>
        <Button onClick={handleSave} className="w-full md:w-auto" size="lg">
          <Save className="w-4 h-4 mr-2" /> Salvar Ficha
        </Button>
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Detalhes Básicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="title">Nome do Treino</Label>
            <Input 
              id="title" 
              placeholder="Ex: Ficha Hipertrofia A - Peito/Tríceps" 
              value={workoutTitle}
              onChange={e => setWorkoutTitle(e.target.value)}
              className="text-lg bg-background"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Exercícios (Série Única)</CardTitle>
          <Button variant="outline" size="sm" onClick={addExercise}>
            <PlusCircle className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercises.map((ex, index) => (
            <div key={ex.id} className="flex flex-col sm:flex-row gap-4 items-center bg-background p-4 rounded-lg border border-border/50 group">
              <GripVertical className="w-5 h-5 text-muted-foreground/50 cursor-grab hidden sm:block" />
              
              <div className="w-full sm:flex-1 space-y-2">
                <Label className="sm:hidden">Exercício</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar no banco de exercícios..." 
                    className="pl-9"
                    value={ex.name}
                    onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                <div className="w-24 space-y-2">
                  <Label>Séries</Label>
                  <Input 
                    type="number" 
                    value={ex.sets}
                    onChange={(e) => updateExercise(ex.id, 'sets', parseInt(e.target.value))}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label>Reps</Label>
                  <Input 
                    value={ex.reps}
                    onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                  />
                </div>
                <div className="pt-8">
                  <Button variant="destructive" size="icon" onClick={() => removeExercise(ex.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {exercises.length === 0 && (
            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
              Nenhum exercício adicionado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <Toaster />
    </div>
  );
}
