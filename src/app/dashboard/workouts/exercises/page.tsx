'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, BookOpen, Search, ArrowRight, Play } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ExercisesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const exercisesRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'exercises'),
      orderBy('name', 'asc')
    );
  }, [firestore, user]);

  const { data: exercises, isLoading } = useCollection(exercisesRef);

  if (!user) return null;

  const filteredExercises = exercises?.filter((ex: any) => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.muscleGroup?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca de Exercícios"
        description="Gerencie o banco de dados de exercícios da sua academia."
      >
        <Button asChild>
          <Link href="/dashboard/workouts/exercises/novo">
            <PlusCircle className="w-4 h-4 mr-2" /> Novo Exercício
          </Link>
        </Button>
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Pesquisar exercícios ou grupos musculares..."
          className="pl-10 box-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="bg-card/50">
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredExercises && filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredExercises.map((exercise: any) => (
            <Card key={exercise.id} className="bg-card/50 hover:bg-card border-primary/10 transition-colors group relative overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  {exercise.videoUrl && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none">
                      <Play className="w-3 h-3 mr-1 fill-current" /> vídeo
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{exercise.name}</CardTitle>
                <CardDescription className="line-clamp-2">{exercise.description || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {exercise.muscleGroup && (
                    <Badge variant="outline">{exercise.muscleGroup}</Badge>
                  )}
                  {exercise.equipment && (
                    <Badge variant="outline" className="opacity-70">{exercise.equipment}</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5" asChild>
                  <Link href={`/dashboard/workouts/exercises/${exercise.id}`}>
                    Ver Detalhes
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-card/30">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>{searchTerm ? 'Nenhum resultado' : 'Biblioteca vazia'}</CardTitle>
          <CardDescription className="max-w-xs mt-2">
            {searchTerm 
              ? `Não encontramos exercícios para "${searchTerm}". Tente outros termos.`
              : 'Você ainda não cadastrou nenhum exercício na biblioteca.'}
          </CardDescription>
          {!searchTerm && (
            <Button className="mt-6" asChild>
              <Link href="/dashboard/workouts/exercises/novo">
                Cadastrar Primeiro Exercício
              </Link>
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
