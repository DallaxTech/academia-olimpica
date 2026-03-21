'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating personalized athlete workout suggestions.
 *
 * - generateAthleteWorkoutSuggestions - A function that handles the generation of workout suggestions.
 * - GenerateAthleteWorkoutSuggestionsInput - The input type for the generateAthleteWorkoutSuggestions function.
 * - GenerateAthleteWorkoutSuggestionsOutput - The return type for the generateAthleteWorkoutSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAthleteWorkoutSuggestionsInputSchema = z.object({
  athletePerformance: z
    .string()
    .describe(
      "Uma descrição detalhada das capacidades físicas atuais, pontos fortes e fracos do atleta (por exemplo, 'Consegue levantar 100kg no supino para 5 repetições, tem dificuldades com cardio sustentado. Lesão recente no ombro esquerdo está totalmente recuperada.')."
    ),
  athleteGoals: z
    .string()
    .describe(
      "Uma declaração clara do que o atleta pretende alcançar (por exemplo, 'Aumentar a força da parte superior do corpo em 20% em 3 meses, melhorar o tempo de corrida de 5k em 1 minuto.')."
    ),
  historicalData: z
    .string()
    .describe(
      "Um resumo do treinamento passado, progresso e qualquer histórico de saúde ou lesão relevante do atleta (por exemplo, 'Últimas 4 semanas incluíram treino de força 3x/semana, cardio 2x/semana. Historicamente responde bem à sobrecarga progressiva.')."
    ),
  requestDescription: z
    .string()
    .describe(
      "A solicitação específica de sugestões de treino (por exemplo, 'Sugira 3 variações para o exercício de barra fixa para atingir diferentes músculos das costas.', 'Crie um novo segmento de treinamento intervalado de alta intensidade (HIIT) de 20 minutos com foco na potência das pernas.', 'Modifique a rotina atual de agachamento para levar em conta a sensibilidade no joelho.')."
    ),
});
export type GenerateAthleteWorkoutSuggestionsInput = z.infer<
  typeof GenerateAthleteWorkoutSuggestionsInputSchema
>;

const GenerateAthleteWorkoutSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'Uma lista de variações de exercícios detalhadas, modificações ou segmentos de treinamento completos.'
    ),
  reasoning: z
    .string()
    .describe(
      'Uma explicação clara e concisa de por que essas sugestões foram feitas, vinculando-as ao desempenho, metas e solicitação específica do atleta.'
    ),
});
export type GenerateAthleteWorkoutSuggestionsOutput = z.infer<
  typeof GenerateAthleteWorkoutSuggestionsOutputSchema
>;

export async function generateAthleteWorkoutSuggestions(
  input: GenerateAthleteWorkoutSuggestionsInput
): Promise<GenerateAthleteWorkoutSuggestionsOutput> {
  return generateAthleteWorkoutSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAthleteWorkoutSuggestionsPrompt',
  input: {schema: GenerateAthleteWorkoutSuggestionsInputSchema},
  output: {schema: GenerateAthleteWorkoutSuggestionsOutputSchema},
  prompt: `Você é um coach de fitness especialista e fisiologista do exercício especializado em criar planos de treinamento personalizados para atletas. Seu objetivo é fornecer sugestões de treino altamente eficazes e seguras.

Com base nas seguintes informações do atleta e na solicitação específica, gere variações detalhadas de exercícios, modificações ou segmentos de treinamento inteiramente novos.

Desempenho Atual do Atleta: {{{athletePerformance}}}
Metas do Atleta: {{{athleteGoals}}}
Dados Históricos do Atleta: {{{historicalData}}}

Solicitação Específica do Analista/Administrador: {{{requestDescription}}}

Forneça sugestões adaptadas às habilidades atuais do atleta, alinhadas com seus objetivos e que levem em consideração seu histórico de treinamento. As sugestões devem ser práticas e acionáveis. Além disso, forneça um raciocínio claro para suas recomendações.

O formato de saída deve ser um objeto JSON contendo um array de 'sugestões' (cada sugestão deve ser uma string detalhada) e uma string de 'raciocínio' explicando por que essas sugestões foram escolhidas.`,
});

const generateAthleteWorkoutSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateAthleteWorkoutSuggestionsFlow',
    inputSchema: GenerateAthleteWorkoutSuggestionsInputSchema,
    outputSchema: GenerateAthleteWorkoutSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
