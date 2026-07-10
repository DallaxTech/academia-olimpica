'use client';

import { useState, use, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, arrayUnion, arrayRemove, orderBy, limit } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { Role, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User as UserIcon, 
  Dumbbell, 
  PlusCircle, 
  Trash2, 
  ArrowRight, 
  Loader2, 
  Activity,
  Clock,
  FileText,
  Heart,
  Calendar,
  Trophy,
  CheckCircle,
  Plus,
  ExternalLink,
  TrendingUp,
  ChevronLeft
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { BioimpedanceSheet } from '@/components/bioimpedance-sheet';
import { LimitationsCard } from '@/components/limitations-card';
import { WorkoutAdaptationSheet } from '@/components/workout-adaptation-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

function getGenderInfo(plan: { gender?: string; name?: string; description?: string }) {
  const gender = plan.gender?.toLowerCase();
  const name = plan.name?.toLowerCase() || '';
  const desc = plan.description?.toLowerCase() || '';

  if (gender === 'male' || name.includes('masculino') || name.includes('homem') || desc.includes('masculino')) {
    return {
      label: 'Masculino',
      class: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a5 5 0 100-10 5 5 0 000 10zM12 11v9M9 16h6" />
        </svg>
      )
    };
  }

  return {
    label: 'Personalizado',
    class: 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
    icon: (
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  };
}

export default function AlunoEvolucaoPage({ params }: { params: Promise<{ id: string }> }) {
  const firestore = useFirestore();
  const { id } = use(params);
  const { toast } = useToast();
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'userProfiles', id);
  }, [firestore, id]);

  const { data: user, isLoading } = useDoc<UserProfile>(userDocRef);

  // Fetch anamnesis
  const anamnesisQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'userProfiles', id, 'anamnesis'), orderBy('createdAt', 'desc'), limit(1));
  }, [firestore, id]);
  const { data: anamnesisList } = useCollection<any>(anamnesisQuery);
  const anamnesis = anamnesisList && anamnesisList.length > 0 ? anamnesisList[0] : null;

  // Fetch workout sessions
  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'userProfiles', id, 'workoutSessions'), orderBy('completedAt', 'desc'));
  }, [firestore, id]);
  const { data: sessions } = useCollection<any>(sessionsQuery);

  // Fetch bioimpedance records
  const bioRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'userProfiles', id, 'bioimpedance'), orderBy('date', 'desc'));
  }, [firestore, id]);
  const { data: bioRecords } = useCollection<any>(bioRef);

  // Fetch medical exams
  const examsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'userProfiles', id, 'exams'), orderBy('date', 'desc'));
  }, [firestore, id]);
  const { data: exams } = useCollection<any>(examsQuery);

  // State for exam dialog/form
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examUrl, setExamUrl] = useState('');
  const [examNotes, setExamNotes] = useState('');
  const [isSavingExam, setIsSavingExam] = useState(false);

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !id || !examName) return;
    setIsSavingExam(true);
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(firestore, 'userProfiles', id, 'exams'), {
        name: examName,
        date: examDate,
        url: examUrl,
        notes: examNotes,
        createdAt: new Date().toISOString()
      });
      toast({ title: 'Exame Adicionado', description: 'O exame foi registrado com sucesso.' });
      setExamName('');
      setExamUrl('');
      setExamNotes('');
      setIsAddExamOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar exame', description: error.message });
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!firestore || !id) return;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(firestore, 'userProfiles', id, 'exams', examId));
      toast({ title: 'Exame Excluído', description: 'O registro do exame foi removido.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir exame', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/alunos">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar para Central de Alunos
          </Link>
        </Button>
      </div>

      <PageHeader title="Acompanhamento do Aluno" />

      {isLoading ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardHeader>
        </Card>
      ) : user ? (
        <div className="space-y-6">
          <Card className="border-primary/10">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback><UserIcon className="h-8 w-8" /></AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{`${user.firstName} ${user.lastName}`}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold">Aluno OlimpoFit</Badge>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span>{user.email}</span>
                  <span className="text-muted-foreground text-xs">•</span>
                  <BioimpedanceSheet athleteId={user.id} athleteName={`${user.firstName} ${user.lastName}`} />
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="workouts" className="w-full space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-secondary/35 border border-border/40 p-1 rounded-xl">
              <TabsTrigger value="workouts" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Dumbbell className="w-3.5 h-3.5" />
                Treinos & Fichas
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-3.5 h-3.5" />
                Histórico de Treinos
              </TabsTrigger>
              <TabsTrigger value="anamnesis" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Activity className="w-3.5 h-3.5" />
                Anamnese & Evolução
              </TabsTrigger>
              <TabsTrigger value="exams" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="w-3.5 h-3.5" />
                Exames Médicos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workouts" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-300">
                <div className="lg:col-span-2">
                  <WorkoutAssignmentSection athleteId={user.id} />
                </div>
                <div>
                  <LimitationsCard athleteId={user.id} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6 mt-4">
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-card border-primary/10">
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs font-semibold">Total de Treinos Concluídos</CardDescription>
                      <CardTitle className="text-3xl font-headline text-primary flex items-center gap-2 mt-1">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        {sessions?.length || 0}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Card className="border-primary/10 bg-card/45 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Histórico de Execuções de Treinos
                    </CardTitle>
                    <CardDescription>Lista cronológica de treinos iniciados e concluídos pelo aluno.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {sessions && sessions.length > 0 ? (
                      <div className="divide-y divide-border/40 max-h-[450px] overflow-y-auto">
                        {sessions.map((s: any, idx: number) => {
                          const date = s.completedAt?.toDate ? s.completedAt.toDate() : (s.completedAt ? new Date(s.completedAt) : new Date());
                          return (
                            <div key={s.id || idx} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-foreground">{s.dayName || 'Treino Concluído'}</h4>
                                  <div className="flex gap-2 items-center text-xs text-muted-foreground mt-0.5">
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/20 bg-primary/5">Fase: {s.phaseName || 'A1'}</Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-t border-border/40">
                        <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-muted-foreground">Nenhum treino executado ainda.</p>
                        <p className="text-xs text-muted-foreground mt-1">O histórico aparecerá assim que o aluno concluir treinos no app.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="anamnesis" className="space-y-6 mt-4">
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Bioimpedance Metrics */}
                {bioRecords && bioRecords.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const latest = bioRecords[0];
                      const oldest = bioRecords[bioRecords.length - 1];
                      const wDiff = Number(latest.weight || 0) - Number(oldest.weight || 0);
                      const fDiff = Number(latest.bodyFat || 0) - Number(oldest.bodyFat || 0);
                      const mDiff = Number(latest.muscleMass || 0) - Number(oldest.muscleMass || 0);

                      return (
                        <>
                          <Card className="bg-card border-primary/10">
                            <CardHeader className="p-4 pb-2">
                              <CardDescription className="text-xs font-semibold">Peso Inicial vs. Atual</CardDescription>
                              <CardTitle className="text-2xl font-headline font-bold flex items-baseline gap-2 mt-1">
                                {latest.weight} kg
                                <span className="text-xs font-bold text-muted-foreground">Inicial: {oldest.weight} kg</span>
                              </CardTitle>
                              <div className={`text-xs font-bold mt-1.5 flex items-center gap-1 ${wDiff <= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                                <TrendingUp className={`w-3.5 h-3.5 ${wDiff <= 0 ? 'rotate-180' : ''}`} />
                                {wDiff > 0 ? `+${wDiff.toFixed(1)}` : wDiff.toFixed(1)} kg desde o início
                              </div>
                            </CardHeader>
                          </Card>

                          <Card className="bg-card border-primary/10">
                            <CardHeader className="p-4 pb-2">
                              <CardDescription className="text-xs font-semibold">Gordura Corporal Inicial vs. Atual</CardDescription>
                              <CardTitle className="text-2xl font-headline font-bold flex items-baseline gap-2 mt-1">
                                {latest.bodyFat}%
                                <span className="text-xs font-bold text-muted-foreground">Inicial: {oldest.bodyFat}%</span>
                              </CardTitle>
                              <div className={`text-xs font-bold mt-1.5 flex items-center gap-1 ${fDiff <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                <TrendingUp className={`w-3.5 h-3.5 ${fDiff <= 0 ? 'rotate-180' : ''}`} />
                                {fDiff > 0 ? `+${fDiff.toFixed(1)}` : fDiff.toFixed(1)}% desde o início
                              </div>
                            </CardHeader>
                          </Card>

                          <Card className="bg-card border-primary/10">
                            <CardHeader className="p-4 pb-2">
                              <CardDescription className="text-xs font-semibold">Massa Muscular Inicial vs. Atual</CardDescription>
                              <CardTitle className="text-2xl font-headline font-bold flex items-baseline gap-2 mt-1">
                                {latest.muscleMass} kg
                                <span className="text-xs font-bold text-muted-foreground">Inicial: {oldest.muscleMass} kg</span>
                              </CardTitle>
                              <div className={`text-xs font-bold mt-1.5 flex items-center gap-1 ${mDiff >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                                <TrendingUp className={`w-3.5 h-3.5 ${mDiff < 0 ? 'rotate-180' : ''}`} />
                                {mDiff > 0 ? `+${mDiff.toFixed(1)}` : mDiff.toFixed(1)} kg desde o início
                              </div>
                            </CardHeader>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-6 bg-secondary/20 rounded-xl border border-border/40 text-center">
                    <TrendingUp className="w-8 h-8 text-muted-foreground/35 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">Nenhuma avaliação de bioimpedância registrada ainda.</p>
                    <p className="text-xs text-muted-foreground mt-1">Utilize o botão de bioimpedância acima para iniciar a medição.</p>
                  </div>
                )}

                {/* Anamnesis details embedded */}
                <div className="border-t border-border/40 pt-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Ficha de Anamnese (Saúde e PAR-Q)
                  </h3>
                  {!anamnesis ? (
                    <div className="p-8 border border-dashed rounded-xl text-center bg-card/30">
                      <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-muted-foreground">O aluno ainda não preencheu o formulário de anamnese.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Objectives */}
                      <Card className="border-primary/10 bg-card/50">
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-primary" />
                            Objetivos & Dados Pessoais
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm p-4 pt-0">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground text-xs block">Altura / Peso</span>
                              <span className="font-semibold">{anamnesis.personalInfo?.height || '-'}cm / {anamnesis.personalInfo?.weight || '-'}kg</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Idade</span>
                              <span className="font-semibold">{anamnesis.personalInfo?.birthDate ? new Date().getFullYear() - new Date(anamnesis.personalInfo.birthDate).getFullYear() : '-'} anos</span>
                            </div>
                          </div>
                          <div className="border-t border-border/40 pt-2 mt-2">
                            <span className="text-muted-foreground text-xs block">Objetivo Declarado</span>
                            <p className="p-2.5 bg-muted/60 rounded-lg text-xs italic mt-1 font-medium text-foreground">"{anamnesis.objective || 'Não informado'}"</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* PAR-Q answers */}
                      <Card className="border-primary/10 bg-card/50">
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            Respostas do Histórico Médico
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs p-4 pt-0">
                          {[
                            { label: "Possui problemas de saúde?", val: anamnesis.medicalHistory?.hasHealthProblem },
                            { label: "Em tratamento médico?", val: anamnesis.medicalHistory?.isUnderMedicalTreatment },
                            { label: "Sente dores no peito?", val: anamnesis.medicalHistory?.hasChestPain },
                            { label: "Já desmaiou ou teve tontura?", val: anamnesis.medicalHistory?.hasFainted },
                            { label: "Usa medicamentos regulares?", val: anamnesis.medicalHistory?.isTakingMedication }
                          ].map((qItem, qIdx) => (
                            <div key={qIdx} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                              <span>{qItem.label}</span>
                              <Badge variant={qItem.val ? "destructive" : "outline"} className="text-[9px] py-0 px-1 font-semibold">{qItem.val ? 'SIM' : 'NÃO'}</Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="exams" className="space-y-6 mt-4">
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Exames Médicos do Aluno
                    </h3>
                    <p className="text-xs text-muted-foreground">Laudos, atestados e avaliações clínicas arquivadas.</p>
                  </div>
                  <Dialog open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold">
                        <Plus className="w-4 h-4 mr-1.5" /> Adicionar Exame
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border border-primary/20 max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          Registrar Novo Exame
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddExam} className="space-y-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground">Nome do Exame / Título *</label>
                          <Input
                            required
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                            placeholder="Ex: Exame de Sangue, Teste Ergométrico"
                            className="bg-background border-primary/15 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground">Data de Realização</label>
                            <Input
                              type="date"
                              value={examDate}
                              onChange={(e) => setExamDate(e.target.value)}
                              className="bg-background border-primary/15 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground">Link do Laudo (URL)</label>
                            <Input
                              value={examUrl}
                              onChange={(e) => setExamUrl(e.target.value)}
                              placeholder="https://drive.google.com/..."
                              className="bg-background border-primary/15 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground">Observações Clínicas / Recomendações</label>
                          <Textarea
                            value={examNotes}
                            onChange={(e) => setExamNotes(e.target.value)}
                            placeholder="Ex: Resultados normais, colesterol levemente alterado..."
                            rows={3}
                            className="bg-background border-primary/15 text-xs resize-none"
                          />
                        </div>
                        <DialogFooter className="pt-2 gap-2 sm:gap-0">
                          <Button type="button" variant="outline" onClick={() => setIsAddExamOpen(false)}>Cancelar</Button>
                          <Button type="submit" disabled={isSavingExam} className="bg-primary text-primary-foreground font-bold">
                            {isSavingExam ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Exame'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {exams && exams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exams.map((exam: any) => (
                      <Card key={exam.id} className="group hover:border-primary/30 transition-all border-primary/10 bg-card/60">
                        <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-sm text-foreground line-clamp-1">{exam.name}</h4>
                              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 shrink-0 bg-secondary/50 px-2 py-0.5 rounded-full">
                                <Calendar className="w-3 h-3 text-primary" />
                                {new Date(exam.date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {exam.notes && (
                              <p className="text-xs text-muted-foreground bg-secondary/15 p-2 rounded mt-2 border border-border/30 line-clamp-2">
                                {exam.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-between items-center border-t border-border/35 pt-2 mt-1">
                            {exam.url ? (
                              <a
                                href={exam.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Ver Laudo do Exame
                              </a>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Sem link anexado</span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                              onClick={() => handleDeleteExam(exam.id)}
                              title="Excluir Registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card/10">
                    <FileText className="w-12 h-12 text-muted-foreground/25 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">Nenhum exame médico anexado.</p>
                    <p className="text-xs text-muted-foreground mt-1">Registre atestados ou exames clínicos usando o botão acima.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card className="flex items-center justify-center h-48">
          <p>Aluno não encontrado.</p>
        </Card>
      )}
    </div>
  );
}

function WorkoutAssignmentSection({ athleteId }: { athleteId: string }) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);

  // Fetch all training plans created by this professor
  const allPlansQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'trainingPlans'), where('createdByUserId', '==', currentUser.uid));
  }, [firestore, currentUser]);

  const { data: allPlans, isLoading: loadingPlans } = useCollection(allPlansQuery);

  // Filter plans assigned to THIS athlete
  const assignedPlans = allPlans?.filter((plan: any) => 
    plan.assignedToAthleteIds?.includes(athleteId)
  ) || [];

  // Plans NOT YET assigned to this athlete
  const availablePlans = allPlans?.filter((plan: any) => 
    !plan.assignedToAthleteIds?.includes(athleteId)
  ) || [];

  const handleLinkPlan = async () => {
    if (!firestore || !selectedPlanId || selectedPlanId === 'none') return;
    setIsLinking(true);
    try {
      const planRef = doc(firestore, 'trainingPlans', selectedPlanId);
      await updateDoc(planRef, {
        assignedToAthleteIds: arrayUnion(athleteId)
      });
      
      toast({ title: 'Treino Vinculado', description: 'O aluno agora tem acesso a esta ficha.' });
      setSelectedPlanId('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao vincular', description: e.message });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkPlan = async (planId: string) => {
    if (!firestore) return;
    try {
      const planRef = doc(firestore, 'trainingPlans', planId);
      await updateDoc(planRef, {
        assignedToAthleteIds: arrayRemove(athleteId)
      });
      toast({ title: 'Treino Removido', description: 'A ficha foi desvinculada deste aluno.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Vincular Novo Plano
          </CardTitle>
          <CardDescription>Atribua um plano de treinamento para este aluno.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um treino..." />
            </SelectTrigger>
            <SelectContent>
              {availablePlans.length > 0 ? (
                availablePlans.map((plan: any) => (
                  <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>Nenhum treino disponível</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button onClick={handleLinkPlan} disabled={!selectedPlanId || selectedPlanId === 'none' || isLinking}>
            {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
            Vincular
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          Treinos Atuais ({assignedPlans.length})
        </h3>
        {loadingPlans ? (
          <Skeleton className="h-24 w-full" />
        ) : assignedPlans.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {assignedPlans.map((plan: any) => (
              <Card key={plan.id} className="group overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold">{plan.name}</h4>
                        {(() => {
                          const info = getGenderInfo(plan);
                          return (
                            <Badge variant="outline" className={`${info.class} text-[10px] py-0 px-1.5 h-4 flex items-center shrink-0`}>
                              {info.label}
                            </Badge>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.daysCount || 0} dias de treino</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <WorkoutAdaptationSheet 
                      athleteId={athleteId}
                      planId={plan.id}
                      planName={plan.name}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/workouts/${plan.id}`} target="_blank" rel="noreferrer">
                        Ver Ficha <ArrowRight className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleUnlinkPlan(plan.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm text-center py-8 border-2 border-dashed rounded-xl">
             Nenhum treino vinculado a este aluno ainda.
          </p>
        )}
      </div>
    </div>
  );
}
