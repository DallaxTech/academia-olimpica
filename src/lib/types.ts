export enum Role {
  Admin = 'Administrator',
  Analyst = 'Analyst',
  Athlete = 'Athlete',
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: Role;
  registrationDate: string;
  lastLoginDate?: string;
  // Gamification & Tracking for Athlete
  streak?: number; 
  lastWorkoutDate?: number; // UNIX timestamp
  active?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  gifUrl?: string; // Usar GIFs curtos para salvar banda
  muscleGroup?: string;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: string;
  restSeconds?: number;
  isCompleted: boolean;
}

export interface WorkoutDay {
  day: number;
  name:string;
  exercises: WorkoutExercise[];
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  assignedTo: string[]; // array of user ids
  days: WorkoutDay[];
}

export interface WorkoutLog {
  id?: string;
  userId: string;
  workoutId: string;
  dayName: string;
  completedAt: number; // Data do treino
  durationMinutes: number;
}
