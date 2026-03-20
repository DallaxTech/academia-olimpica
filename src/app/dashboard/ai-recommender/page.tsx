'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import {
  generateAthleteWorkoutSuggestions,
  type GenerateAthleteWorkoutSuggestionsOutput,
} from '@/ai/flows/generate-athlete-workout-suggestions';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2, Lightbulb, Activity } from 'lucide-react';
import { users } from '@/lib/data';
import { Role } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  athleteId: z.string().min(1, 'Please select an athlete.'),
  requestDescription: z
    .string()
    .min(10, 'Please provide a more detailed request.')
    .max(500),
});

const athletes = users.filter((user) => user.role === Role.Athlete);

export default function AiRecommenderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateAthleteWorkoutSuggestionsOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      athleteId: '',
      requestDescription: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    const selectedAthlete = athletes.find(a => a.id === values.athleteId);
    if (!selectedAthlete) {
        toast({ title: 'Error', description: 'Selected athlete not found.', variant: 'destructive'});
        setIsLoading(false);
        return;
    }

    try {
      const response = await generateAthleteWorkoutSuggestions({
        athletePerformance: `Strength: ${selectedAthlete.performanceMetrics?.strength}/100, Cardio: ${selectedAthlete.performanceMetrics?.cardio}/100, Flexibility: ${selectedAthlete.performanceMetrics?.flexibility}/100.`,
        athleteGoals: selectedAthlete.goals || 'Not specified.',
        historicalData: selectedAthlete.historicalData || 'No historical data.',
        requestDescription: values.requestDescription,
      });
      setResult(response);
    } catch (error) {
      console.error('AI generation failed:', error);
      toast({ title: 'Error', description: 'Failed to generate suggestions. Please try again.', variant: 'destructive'});
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="AI Training Recommender"
        description="Generate personalized workout suggestions for athletes."
      />
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generate Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="athleteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Athlete</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an athlete to get recommendations for" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {athletes.map(athlete => (
                                <SelectItem key={athlete.id} value={athlete.id}>{athlete.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requestDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Request</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., 'Suggest 3 variations for pull-ups to target different back muscles' or 'Create a new 20-minute HIIT segment for leg power'."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe what kind of suggestion you need from the AI.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Generate
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8">
            {isLoading && (
                <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center h-96">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="font-semibold text-lg">Generating suggestions...</p>
                        <p className="text-sm text-muted-foreground">The AI is crafting the perfect plan.</p>
                    </CardContent>
                </Card>
            )}
            {result && (
                <>
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Activity className="h-6 w-6 text-primary"/>
                        <CardTitle>AI Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 list-disc pl-5 text-sm">
                            {result.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                         <Lightbulb className="h-6 w-6 text-accent"/>
                        <CardTitle>Reasoning</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                    </CardContent>
                </Card>
                </>
            )}
        </div>
      </div>
    </>
  );
}
