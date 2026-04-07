'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Heart, Activity, Target, User, Info, Loader2, Calendar } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { UserProfile } from '@/lib/types';

export default function ProfessorAnamnesePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: athleteId } = use(params);
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);
  const [anamnesis, setAnamnesis] = useState<any>(null);

  // Fetch student info
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !athleteId) return null;
    return doc(firestore, 'userProfiles', athleteId);
  }, [firestore, athleteId]);
  const { data: athlete } = useDoc<UserProfile>(userDocRef);

  // Load latest anamnesis
  useEffect(() => {
    async function loadAnamnesis() {
      if (!firestore || !athleteId) return;
      try {
        const anamnesisRef = collection(firestore, 'userProfiles', athleteId, 'anamnesis');
        const q = query(anamnesisRef, orderBy('createdAt', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setAnamnesis(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error loading anamnesis:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnamnesis();
  }, [firestore, athleteId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando avaliação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar ao Perfil
        </Button>
      </div>

      <PageHeader 
        title={`Anamnese: ${athlete?.firstName} ${athlete?.lastName}`} 
        description="Histórico de saúde e avaliação física"
      />

      {!anamnesis ? (
        <Card className="border-dashed flex flex-col items-center justify-center py-12 text-center">
          <Activity className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <CardTitle className="text-muted-foreground">Nenhuma avaliação encontrada</CardTitle>
          <CardDescription className="max-w-xs mx-auto mt-2">
            Este aluno ainda não preencheu a ficha de anamnese.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary Banner */}
          <Card className="md:col-span-2 border-primary/20 bg-primary/5">
             <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-primary" />
                   <span className="text-sm font-medium">Avaliação realizada em: {anamnesis.createdAt?.toDate().toLocaleDateString('pt-BR')}</span>
                </div>
                <Badge variant="outline" className="bg-background">Fase Atual: {anamnesis.lifestyle?.activityLevel}</Badge>
             </CardHeader>
          </Card>

          {/* Section 1: Personal & Objective */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados Pessoais & Objetivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground font-medium">Gênero</p>
                  <p className="font-bold capitalize">{anamnesis.personalInfo?.gender || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Idade</p>
                  <p className="font-bold">{anamnesis.personalInfo?.birthDate ? new Date().getFullYear() - new Date(anamnesis.personalInfo.birthDate).getFullYear() : '-'} anos</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Altura / Peso</p>
                  <p className="font-bold">{anamnesis.personalInfo?.height}cm / {anamnesis.personalInfo?.weight}kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Profissão</p>
                  <p className="font-bold capitalize">{anamnesis.personalInfo?.occupation || '-'}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground font-medium mb-1">Objetivo na Academia</p>
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 text-sm italic">
                   "{anamnesis.objective || 'Nenhum informado'}"
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Lifestyle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Estilo de Vida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={anamnesis.lifestyle?.isSmoker ? "destructive" : "outline"}>
                   {anamnesis.lifestyle?.isSmoker ? "Fumante" : "Não Fumante"}
                </Badge>
                <Badge variant={anamnesis.lifestyle?.drinksAlcohol ? "destructive" : "outline"}>
                   {anamnesis.lifestyle?.drinksAlcohol ? "Consome Álcool" : "Não Bebe"}
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                   Nível: {anamnesis.lifestyle?.activityLevel}
                </Badge>
              </div>
              <div className="pt-2">
                 <p className="text-sm text-muted-foreground font-medium mb-2">Comentários Adicionais</p>
                 <p className="text-sm text-muted-foreground bg-secondary/10 p-3 rounded-lg">
                    {anamnesis.observations || "Nenhuma observação informada."}
                 </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Health Risks (PAR-Q) */}
          <Card className={`${Object.values(anamnesis.medicalHistory || {}).some(v => v === true) ? 'border-red-500/20 shadow-red-500/5' : ''}`}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Avaliação de Saúde
              </CardTitle>
              <CardDescription>Respostas positivas indicam necessidade de atenção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
               {[
                 { label: "Apresenta problema de saúde?", val: anamnesis.medicalHistory?.hasHealthProblem },
                 { label: "Em tratamento médico?", val: anamnesis.medicalHistory?.isUnderMedicalTreatment },
                 { label: "Já sentiu dores no peito?", val: anamnesis.medicalHistory?.hasChestPain },
                 { label: "Já sofreu desmaio?", val: anamnesis.medicalHistory?.hasFainted },
                 { label: "Período gestacional?", val: anamnesis.medicalHistory?.isPregnant },
                 { label: "Parto recente?", val: anamnesis.medicalHistory?.recentBirth },
                 { label: "Cirurgia recente?", val: anamnesis.medicalHistory?.recentSurgery },
                 { label: "FUMANTE?", val: anamnesis.medicalHistory?.isSmoker },
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
                    <span className="text-xs font-medium">{item.label}</span>
                    <Badge variant={item.val ? "destructive" : "outline"} className="text-[10px] h-5">
                       {item.val ? "SIM" : "NÃO"}
                    </Badge>
                 </div>
               ))}
            </CardContent>
          </Card>

          {/* Section 4: Clinical History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Histórico Clínico & Medicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <p className="text-sm font-medium text-muted-foreground">Medicamentos em uso</p>
                  <p className="text-sm font-bold">{anamnesis.medicalHistory?.isTakingMedication || "Nenhum informado"}</p>
               </div>
               <div>
                  <p className="text-sm font-medium text-muted-foreground">Cirurgias prévias</p>
                  <p className="text-sm font-bold">{anamnesis.medicalHistory?.pastSurgeries || "Nenhuma informada"}</p>
               </div>
               <div>
                  <p className="text-sm font-medium text-muted-foreground">Alergias conhecidas</p>
                  <p className="text-sm font-bold">{anamnesis.medicalHistory?.allergies || "Nenhuma informada"}</p>
               </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
