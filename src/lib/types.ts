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
