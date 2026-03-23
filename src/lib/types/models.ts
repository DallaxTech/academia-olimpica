export type Role = 'aluno' | 'professor' | 'admin';

export interface UserDB {
  id: string; // Firebase Auth UID
  role: Role;
  name: string;
  email: string;
  createdAt: number;
  // Gamification & Tracking
  streak: number; 
  lastWorkoutDate?: number; // UNIX timestamp
  active: boolean; // para o semáforo de retenção
}

export interface Exercise {
  id: string; // Pode ser gerado automaticamente
  name: string;
  muscleGroup: string;
  gifUrl?: string; // Usar GIFs curtos para salvar banda
  instructions?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string; // Desnormalizado para fácil leitura
  sets: number; // Séries
  reps: string; // Repetições (ex: "10-12" ou "Até a falha")
  restSeconds: number; // Tempo de descanso
}

export interface WorkoutPhase {
  id: string;
  name: string; // ex: "Série A - Peito e Tríceps"
  exercises: WorkoutExercise[];
}

// O Template criado pelo Professor
export interface WorkoutTemplate {
  id?: string;
  title: string;
  description?: string;
  createdBy: string; // Professor ID
  createdAt: number;
  phases: WorkoutPhase[];
}

// O Treino atribuído a um Aluno
export interface UserWorkout {
  id?: string;
  userId: string; // Aluno ID
  templateId?: string; // Se veio de um template
  title: string;
  assignedBy: string; // Professor ID
  assignedAt: number;
  active: boolean; // É o treino atual do aluno?
  phases: WorkoutPhase[];
}

// O histórico diário quando o aluno finaliza o treino no App
export interface WorkoutLog {
  id?: string;
  userId: string;
  userWorkoutId: string;
  phaseName: string; // Qual série ele fez hoje
  completedAt: number; // Data do treino
  durationMinutes: number;
  // Opcional: Estatísticas detalhadas de carga por exercício
  exercisesLog?: {
    exerciseId: string;
    exerciseName: string;
    setsCompleted: { weight: number; reps: number }[];
  }[];
}
