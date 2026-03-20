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
      "A detailed description of the athlete's current physical capabilities, strengths, and weaknesses (e.g., 'Can bench press 100kg for 5 reps, struggles with sustained cardio. Recent injury to left shoulder is fully recovered.')."
    ),
  athleteGoals: z
    .string()
    .describe(
      "A clear statement of what the athlete aims to achieve (e.g., 'Increase upper body strength by 20% in 3 months, improve 5k run time by 1 minute.')."
    ),
  historicalData: z
    .string()
    .describe(
      "A summary of the athlete's past training, progress, and any relevant health or injury history (e.g., 'Last 4 weeks included strength training 3x/week, cardio 2x/week. Historically responds well to progressive overload.')."
    ),
  requestDescription: z
    .string()
    .describe(
      "The specific request for workout suggestions (e.g., 'Suggest 3 variations for the pull-up exercise to target different back muscles.', 'Create a new 20-minute high-intensity interval training (HIIT) segment focusing on leg power.', 'Modify current squat routine to account for knee sensitivity.')."
    ),
});
export type GenerateAthleteWorkoutSuggestionsInput = z.infer<
  typeof GenerateAthleteWorkoutSuggestionsInputSchema
>;

const GenerateAthleteWorkoutSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'An array of detailed exercise variations, modifications, or complete training segments.'
    ),
  reasoning: z
    .string()
    .describe(
      'A clear and concise explanation of why these suggestions were made, linking them back to the athlete\'s performance, goals, and the specific request.'
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
  prompt: `You are an expert fitness coach and exercise physiologist specializing in creating personalized training plans for athletes. Your goal is to provide highly effective and safe workout suggestions.

Based on the following athlete information and specific request, generate detailed exercise variations, modifications, or entirely new training segments.

Athlete's Current Performance: {{{athletePerformance}}}
Athlete's Goals: {{{athleteGoals}}}
Athlete's Historical Data: {{{historicalData}}}

Specific Request from Analyst/Administrator: {{{requestDescription}}}

Please provide suggestions that are tailored to the athlete's current abilities, align with their goals, and take into account their training history. The suggestions should be practical and actionable. Also, provide a clear reasoning for your recommendations.

Output format should be a JSON object containing an array of 'suggestions' (each suggestion should be a detailed string) and a 'reasoning' string explaining why these suggestions were chosen.`,
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
