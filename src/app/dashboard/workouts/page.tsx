'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Dumbbell, Calendar, ArrowRight, Loader2, Search, Filter } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function WorkoutsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'preConfigured' | 'personalized' | 'regular'>('preConfigured');

  const trainingPlansRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'trainingPlans'),
      where('createdByUserId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: plans, isLoading } = useCollection(trainingPlansRef);

  const filteredPlans = plans?.filter((plan: any) => {
    // 1. Tab filter
    const isPersonalized = plan.isPersonalized === true;
    const isPreConfigured = plan.isPreConfigured === true;
    if (activeTab === 'preConfigured' && !isPreConfigured) return false;
    if (activeTab === 'personalized' && !isPersonalized) return false;
    if (activeTab === 'regular' && (isPersonalized || isPreConfigured)) return false;

    // 2. Search term match
    const name = plan.name?.toLowerCase() || '';
    const desc = plan.description?.toLowerCase() || '';
    const athleteName = (plan.athleteName || plan.name?.replace('Plano Personalizado - ', '') || '').toLowerCase();
    const matchesSearch = 
      name.includes(searchTerm.toLowerCase()) || 
      desc.includes(searchTerm.toLowerCase()) ||
      athleteName.includes(searchTerm.toLowerCase());

    // 3. Gender match
    if (genderFilter === 'all') return matchesSearch;

    const info = getGenderInfo(plan);
    const planGenderLabel = info.label.toLowerCase(); // 'masculino', 'feminino', or 'personalizado'
    
    const matchesGender = 
      (genderFilter === 'male' && planGenderLabel === 'masculino') ||
      (genderFilter === 'female' && planGenderLabel === 'feminino') ||
      (genderFilter === 'custom' && planGenderLabel === 'personalizado');

    return matchesSearch && matchesGender;
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Treinos"
        description="Crie e gerencie as fichas de treinamento da sua academia."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
            <Link href="/dashboard/workouts/personalizado?preConfigured=true">
              <PlusCircle className="w-4 h-4 mr-2" /> Criar Treino Pré-Configurado
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
            <Link href="/dashboard/workouts/personalizado">
              <PlusCircle className="w-4 h-4 mr-2" /> Criar Plano Personalizado
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/workouts/novo">
              <PlusCircle className="w-4 h-4 mr-2" /> Novo Plano
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('preConfigured')}
          className={`py-2 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'preConfigured'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Treinos Pré-Configurados
        </button>
        <button
          onClick={() => setActiveTab('personalized')}
          className={`py-2 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'personalized'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Treinos Personalizados
        </button>
        <button
          onClick={() => setActiveTab('regular')}
          className={`py-2 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'regular'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Treinos Regulares
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou descrição do treino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-[220px]">
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por sexo" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os sexos</SelectItem>
              <SelectItem value="male">Masculino (Homem)</SelectItem>
              <SelectItem value="female">Feminino (Mulher)</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
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
      ) : plans && plans.length > 0 ? (
        filteredPlans && filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredPlans.map((plan: any) => {
              const genderInfo = getGenderInfo(plan);
              return (
                <Card key={plan.id} className="bg-card/50 hover:bg-card border-primary/10 transition-colors group">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        <Badge variant="outline" className={genderInfo.class}>
                          {genderInfo.icon}
                          {genderInfo.label}
                        </Badge>
                        {plan.isPersonalized ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 max-w-[150px] truncate block" title={plan.athleteName || plan.name?.replace('Plano Personalizado - ', '')}>
                            Aluno: {plan.athleteName || plan.name?.replace('Plano Personalizado - ', '')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {plan.assignedToAthleteIds?.length || 0} Alunos
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="mt-4">{plan.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground gap-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {plan.createdAt?.toDate ? plan.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recém criado'}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5" asChild>
                      <Link href={`/dashboard/workouts/${plan.id}`}>
                        Ver Detalhes
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-card/30">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Nenhum treino encontrado</CardTitle>
            <CardDescription className="max-w-xs mt-2">
              Nenhum treino corresponde à busca ou ao filtro de sexo selecionado.
            </CardDescription>
            <Button className="mt-6" variant="outline" onClick={() => { setSearchTerm(''); setGenderFilter('all'); }}>
              Limpar Filtros
            </Button>
          </Card>
        )
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-card/30">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>Nenhuma ficha encontrada</CardTitle>
          <CardDescription className="max-w-xs mt-2">
            Você ainda não criou nenhuma ficha de treino. Comece criando sua primeira agora mesmo!
          </CardDescription>
          <Button className="mt-6" asChild>
            <Link href="/dashboard/workouts/novo">
              Criar Primeira Ficha
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}

