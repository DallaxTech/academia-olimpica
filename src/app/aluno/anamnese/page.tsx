'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, Save, Heart, Activity, Target, User, Info, Loader2, CheckCircle2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

const OBJECTIVE_CATEGORIES = [
  'CONDICIONAMENTO FÍSICO',
  'EMAGRECIMENTO',
  'HIPERTROFIA'
];

export default function AnamnesePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    personalInfo: {
      gender: '',
      birthDate: '',
      height: '',
      weight: '',
      occupation: ''
    },
    objective: '',
    lifestyle: {
      isSmoker: false,
      drinksAlcohol: false,
      activityLevel: 'Sedentário'
    },
    medicalHistory: {
      hasHealthProblem: false,
      isUnderMedicalTreatment: false,
      hasChestPain: false,
      hasFainted: false,
      isPregnant: false,
      recentBirth: false,
      recentSurgery: false,
      isSmoker: false,
      isTakingMedication: '',
      pastSurgeries: '',
      allergies: ''
    },
    observations: ''
  });

  // Load existing anamnesis if available
  useEffect(() => {
    async function loadAnamnesis() {
      if (!firestore || !user) return;
      setLoading(true);
      try {
        const anamnesisRef = collection(firestore, 'userProfiles', user.uid, 'anamnesis');
        const q = query(anamnesisRef, orderBy('createdAt', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setFormData(prev => ({
            ...prev,
            ...data,
            personalInfo: { ...prev.personalInfo, ...data.personalInfo },
            lifestyle: { ...prev.lifestyle, ...data.lifestyle },
            medicalHistory: { ...prev.medicalHistory, ...data.medicalHistory }
          }));
        }
      } catch (error) {
        console.error("Error loading anamnesis:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnamnesis();
  }, [firestore, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    if (!formData.objective) {
      toast({ title: "Atenção", description: "Selecione o seu objetivo principal.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const assessmentId = crypto.randomUUID();
      const assessmentRef = doc(firestore, 'userProfiles', user.uid, 'anamnesis', assessmentId);
      
      await setDoc(assessmentRef, {
        ...formData,
        id: assessmentId,
        athleteId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Sucesso!",
        description: "Sua ficha de anamnese foi salva com sucesso.",
      });
      
      setTimeout(() => router.push('/aluno'), 1500);
    } catch (error) {
      console.error("Error saving anamnesis:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar sua ficha. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando seus dados...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-headline font-bold">Ficha de Anamnese</h1>
          <p className="text-muted-foreground text-sm">Sua saúde em primeiro lugar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section: Objective Selection (NOW CATEGORIZED) */}
        <Card className="border-primary/20 shadow-md overflow-hidden bg-primary/5">
          <CardHeader className="bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Qual o seu Objetivo Principal?</CardTitle>
            </div>
            <CardDescription>Selecione uma das categorias abaixo</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OBJECTIVE_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={formData.objective === cat ? "default" : "outline"}
                  className={`h-auto py-4 text-xs font-bold transition-all ${formData.objective === cat ? 'shadow-lg shadow-primary/20' : 'hover:bg-primary/5'}`}
                  onClick={() => setFormData({...formData, objective: cat})}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Personal Info */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-secondary/20 border-b border-border/50">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            </div>
            <CardDescription>Informações básicas para compor seu perfil</CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Input 
                id="gender" 
                placeholder="Ex: Masculino, Feminino..." 
                value={formData.personalInfo.gender}
                onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, gender: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input 
                id="birthDate" 
                type="date"
                value={formData.personalInfo.birthDate}
                onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, birthDate: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input 
                id="height" 
                type="number" 
                placeholder="Ex: 175"
                value={formData.personalInfo.height}
                onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, height: e.target.value}})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input 
                id="weight" 
                type="number" 
                step="0.1" 
                placeholder="Ex: 75.5"
                value={formData.personalInfo.weight}
                onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, weight: e.target.value}})}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="occupation">Profissão</Label>
              <Input 
                id="occupation" 
                placeholder="Ex: Engenheiro, Estudante..."
                value={formData.personalInfo.occupation}
                onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, occupation: e.target.value}})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Lifestyle */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-secondary/20 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Estilo de Vida</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-xl border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-primary">Álcool?</Label>
                  <p className="text-xs text-muted-foreground">Consome com regularidade?</p>
                </div>
                <Switch 
                  checked={formData.lifestyle.drinksAlcohol}
                  onCheckedChange={(checked) => setFormData({...formData, lifestyle: {...formData.lifestyle, drinksAlcohol: checked}})}
                />
              </div>
              <div className="space-y-2">
                <Label>Nível de Atividade Atual</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Sedentário', 'Ativo', 'Muito Ativo'].map((level) => (
                    <Button
                      key={level}
                      type="button"
                      variant={formData.lifestyle.activityLevel === level ? "default" : "outline"}
                      className="text-[10px] h-8 px-2"
                      onClick={() => setFormData({...formData, lifestyle: {...formData.lifestyle, activityLevel: level}})}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Medical History (PAR-Q UPDATED) */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <CardTitle className="text-lg">Avaliação de Saúde</CardTitle>
            </div>
            <CardDescription className="text-red-500/80">Responda com honestidade para sua segurança</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <Label className="flex-1 font-medium">Apresenta algum problema de saúde?</Label>
              <Switch checked={formData.medicalHistory.hasHealthProblem} onCheckedChange={(v) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, hasHealthProblem: v}})} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <Label className="flex-1 font-medium">Encontra-se em tratamento médico?</Label>
              <Switch checked={formData.medicalHistory.isUnderMedicalTreatment} onCheckedChange={(v) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, isUnderMedicalTreatment: v}})} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <Label className="flex-1 font-medium">Já sentiu dores no peito?</Label>
              <Switch checked={formData.medicalHistory.hasChestPain} onCheckedChange={(v) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, hasChestPain: v}})} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <Label className="flex-1 font-medium">Já sofreu desmaio?</Label>
              <Switch checked={formData.medicalHistory.hasFainted} onCheckedChange={(v) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, hasFainted: v}})} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <Label className="flex-1 font-medium">Encontra-se em período gestacional?</Label>
              <Switch checked={formData.medicalHistory.isPregnant} onCheckedChange={(v) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, isPregnant: v}})} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <Label className="flex-1 font-medium">Teve parto recente?</Label>
              <Switch checked={formData.medicalHistory.recentBirth} onCheckedChange={(v) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, recentBirth: v}})} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <Label className="flex-1 font-medium">Cirurgia recente?</Label>
              <Switch checked={formData.medicalHistory.recentSurgery} onCheckedChange={(v) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, recentSurgery: v}})} />
            </div>
            <div className="flex items-center justify-between py-3">
              <Label className="flex-1 font-medium font-bold text-red-500">FUMANTE?</Label>
              <Switch checked={formData.medicalHistory.isSmoker} onCheckedChange={(v) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, isSmoker: v}})} />
            </div>

            <div className="space-y-4 pt-4 border-t mt-4">
              <div className="space-y-2">
                <Label htmlFor="medication">Está tomando algum medicamento de uso contínuo?</Label>
                <Input 
                  id="medication" 
                  placeholder="Ex: Pressão, Diabetes, Coração..."
                  value={formData.medicalHistory.isTakingMedication}
                  onChange={(e) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, isTakingMedication: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Possui alguma alergia?</Label>
                <Input 
                  id="allergies" 
                  placeholder="Ex: Medicamentos, Alimentos..."
                  value={formData.medicalHistory.allergies}
                  onChange={(e) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, allergies: e.target.value}})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Observations */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-secondary/20 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Observações Finais</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Textarea 
              placeholder="Algo mais que seu professor deva saber? Lesões passadas, dores específicas, etc."
              className="min-h-[100px]"
              value={formData.observations}
              onChange={(e) => setFormData({...formData, observations: e.target.value})}
            />
          </CardContent>
        </Card>

        {/* Submit Float Button Container */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30">
          <Button 
            type="submit" 
            disabled={saving}
            className="w-full h-14 text-lg font-bold shadow-2xl shadow-primary/30 rounded-2xl transition-all active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Avaliação
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
