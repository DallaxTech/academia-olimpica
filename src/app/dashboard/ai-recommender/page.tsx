'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, BrainCircuit, History, Target, Zap, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { generateAthleteWorkoutSuggestions, type GenerateAthleteWorkoutSuggestionsOutput } from '@/ai/flows/generate-athlete-workout-suggestions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function AiRecommenderPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateAthleteWorkoutSuggestionsOutput | null>(null);
  
  const [form, setForm] = useState({
    athletePerformance: '',
    athleteGoals: '',
    historicalData: '',
    requestDescription: ''
  });

  const handleGenerate = async () => {
    if (!form.athletePerformance || !form.athleteGoals || !form.requestDescription) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha as informações do atleta e a solicitação.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const data = await generateAthleteWorkoutSuggestions(form);
      setResult(data);
      toast({
        title: "Sucesso!",
        description: "Recomendações geradas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro na geração",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-12">
      <PageHeader
        title="Olimpo AI - Inteligência Esportiva"
        description="Utilize o poder das novas redes neurais para otimizar treinos e superar limites."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-card/50 border-primary/10 overflow-hidden shadow-xl backdrop-blur-sm">
            <CardHeader className="bg-primary/5 py-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Parâmetros do Atleta</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                  <Label htmlFor="performance" className="text-sm font-semibold">Resumo de Performance</Label>
                </div>
                <Textarea 
                  id="performance" 
                  placeholder="Ex: Consegue levantar 100kg no supino, dificuldades com cardio..."
                  className="bg-background/40 border-none focus-visible:ring-primary/30 min-h-[100px] transition-all resize-none"
                  value={form.athletePerformance}
                  onChange={e => setForm({...form, athletePerformance: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <Label htmlFor="goals" className="text-sm font-semibold">Objetivos de Curto/Longo Prazo</Label>
                </div>
                <Textarea 
                  id="goals" 
                  placeholder="Ex: Aumentar força superior em 20%, melhorar 5k em 1 min..."
                  className="bg-background/40 border-none focus-visible:ring-primary/30 min-h-[100px] transition-all resize-none"
                  value={form.athleteGoals}
                  onChange={e => setForm({...form, athleteGoals: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <History className="w-4 h-4 text-primary" />
                  <Label htmlFor="history" className="text-sm font-semibold">Histórico de Lesões e Treino (Opcional)</Label>
                </div>
                <Textarea 
                  id="history" 
                  placeholder="Ex: Últimas 4 semanas treino de força 3x/semana. Sem lesões."
                  className="bg-background/40 border-none focus-visible:ring-primary/30 min-h-[80px] transition-all resize-none"
                  value={form.historicalData}
                  onChange={e => setForm({...form, historicalData: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <Label htmlFor="request" className="text-sm font-bold text-primary italic">O que você deseja que a IA gere?</Label>
                </div>
                <Textarea 
                  id="request" 
                  placeholder="Ex: Sugira variações para barra fixa focando em bíceps."
                  className="bg-primary/5 border-primary/20 focus-visible:ring-primary/40 min-h-[100px] font-medium"
                  value={form.requestDescription}
                  onChange={e => setForm({...form, requestDescription: e.target.value})}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                className="w-full h-12 text-md font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-3" />
                )}
                {loading ? 'Consultando IA...' : 'Gerar Recomendações'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-primary/10 rounded-3xl flex flex-col items-center justify-center p-12 text-center bg-primary/5">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                <BrainCircuit className="w-10 h-10 text-primary opacity-50" />
              </div>
              <h3 className="text-xl font-bold mb-2">Aguardando Parâmetros</h3>
              <p className="text-muted-foreground max-w-sm">
                Preencha os dados do atleta à esquerda para receber uma análise biomecânica e sugestões de treinamento personalizadas.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[400px] border border-primary/20 rounded-3xl flex flex-col items-center justify-center p-12 text-center bg-card shadow-inner overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent animate-pulse" />
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h3 className="text-2xl font-bold mb-4 animate-bounce">Processando Inteligência...</h3>
              <div className="w-full max-w-xs h-2 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-full" />
              </div>
              <p className="mt-8 text-muted-foreground italic">"Analisando padrões de movimento e otimizando variáveis de treino..."</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
              <Card className="bg-primary/5 border-primary/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageSquareQuote className="w-24 h-24 rotate-12" />
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Zap className="w-5 h-5" />
                    Raciocínio Técnico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed text-foreground/90 font-medium">
                    {result.reasoning}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground pl-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Sugestões de Treinamento
                </h4>
                {result.suggestions.map((suggestion, idx) => (
                  <Card key={idx} className={cn(
                    "bg-card border-l-4 border-l-primary/50 border-r-none border-y-none hover:bg-primary/5 transition-all duration-300",
                    "group"
                  )}>
                    <CardContent className="p-6 flex gap-4">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {idx + 1}
                      </div>
                      <p className="text-foreground/90 font-medium">{suggestion}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="outline" onClick={() => setResult(null)} className="h-10">
                  Nova Análise
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
