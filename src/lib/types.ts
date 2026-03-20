export enum Role {
  Admin = 'admin',
  Analyst = 'analyst',
  Athlete = 'athlete',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  performanceMetrics?: {
    strength: number;
    cardio: number;
    flexibility: number;
  };
  historicalData?: string;
  goals?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: string;
  isCompleted: boolean;
}

export interface WorkoutDay {
  day: number;
  name: string;
  exercises: WorkoutExercise[];
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  assignedTo: string[]; // array of user ids
  days: WorkoutDay[];
}
