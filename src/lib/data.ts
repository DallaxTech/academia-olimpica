import { User, Workout, Role, Exercise } from './types';

export const users: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.j@olimpo.fit',
    role: Role.Athlete,
    avatar: 'athlete1',
    performanceMetrics: {
      strength: 85,
      cardio: 70,
      flexibility: 60,
    },
    historicalData: "Last 4 weeks included strength training 3x/week, cardio 2x/week. Historically responds well to progressive overload. Recent focus on improving squat depth.",
    goals: "Increase bench press by 10% in 2 months. Improve 5k run time below 22 minutes.",
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria.g@olimpo.fit',
    role: Role.Athlete,
    avatar: 'athlete2',
    performanceMetrics: {
      strength: 75,
      cardio: 90,
      flexibility: 80,
    },
    historicalData: "Follows a hybrid training model. Recently completed a half-marathon. Needs to incorporate more power-based movements.",
    goals: "Improve explosive power for short sprints. Increase overall muscle endurance for competitive events.",
  },
  {
    id: '3',
    name: 'Chen Wei',
    email: 'chen.w@olimpo.fit',
    role: Role.Athlete,
    avatar: 'athlete3',
    performanceMetrics: {
      strength: 92,
      cardio: 65,
      flexibility: 70,
    },
    historicalData: "Focused on Olympic weightlifting. Current PRs: Snatch 100kg, Clean & Jerk 130kg. Struggles with sustained cardio.",
    goals: "Qualify for national weightlifting championship. Improve cardiovascular health without losing muscle mass.",
  },
  {
    id: '4',
    name: 'Samira Khan',
    email: 'samira.k@olimpo.fit',
    role: Role.Analyst,
    avatar: 'analyst',
  },
  {
    id: '5',
    name: 'David Miller',
    email: 'david.m@olimpo.fit',
    role: Role.Admin,
    avatar: 'admin',
  },
];

const exercises: { [key: string]: Exercise } = {
  squat: { id: 'ex1', name: 'Barbell Squat', description: 'A compound exercise that works the thighs, hips, and buttocks.' },
  bench: { id: 'ex2', name: 'Bench Press', description: 'An upper-body strength training exercise that consists of pressing a weight upwards from a supine position.' },
  deadlift: { id: 'ex3', name: 'Deadlift', description: 'A weight training exercise in which a loaded barbell or bar is lifted off the floor to the level of the hips, then lowered to the floor.' },
  pullup: { id: 'ex4', name: 'Pull-up', description: 'An upper-body strength exercise. The body is suspended by the hands and pulled upwards.' },
  run: { id: 'ex5', name: '5k Run', description: 'A 5-kilometer run for cardiovascular endurance.' },
  plank: { id: 'ex6', name: 'Plank', description: 'An isometric core strength exercise that involves maintaining a position similar to a push-up for the maximum possible time.' },
  burpee: { id: 'ex7', name: 'Burpee', description: 'A full body exercise used in strength training and as an aerobic exercise.' }
};

export const workouts: Workout[] = [
  {
    id: 'w1',
    name: 'Foundational Strength',
    description: 'A 3-day split focusing on building a strong base with compound lifts.',
    assignedTo: ['1', '3'],
    days: [
      {
        day: 1,
        name: 'Upper Body Push',
        exercises: [
          { exercise: exercises.bench, sets: 4, reps: '6-8', isCompleted: false },
          { exercise: { id: 'ex8', name: 'Overhead Press', description: 'Pressing a weight from shoulders to overhead.' }, sets: 3, reps: '8-10', isCompleted: false },
        ],
      },
      {
        day: 2,
        name: 'Lower Body',
        exercises: [
          { exercise: exercises.squat, sets: 4, reps: '6-8', isCompleted: false },
          { exercise: exercises.deadlift, sets: 3, reps: '5', isCompleted: false },
        ],
      },
      {
        day: 3,
        name: 'Upper Body Pull',
        exercises: [
          { exercise: exercises.pullup, sets: 4, reps: 'As many as possible', isCompleted: false },
          { exercise: { id: 'ex9', name: 'Bent Over Row', description: 'A weight training exercise that targets a variety of back muscles.' }, sets: 3, reps: '8-10', isCompleted: false },
        ],
      },
    ],
  },
  {
    id: 'w2',
    name: 'Cardio & Core',
    description: 'A plan designed to improve cardiovascular endurance and core stability.',
    assignedTo: ['2'],
    days: [
      {
        day: 1,
        name: 'Endurance Run',
        exercises: [
          { exercise: exercises.run, sets: 1, reps: '30 minutes', isCompleted: false },
          { exercise: exercises.plank, sets: 3, reps: '60 seconds', isCompleted: false },
        ],
      },
      {
        day: 2,
        name: 'HIIT Session',
        exercises: [
          { exercise: exercises.burpee, sets: 5, reps: '1 minute on, 30 seconds off', isCompleted: false },
          { exercise: { id: 'ex10', name: 'Kettlebell Swings', description: 'A ballistic exercise used to train the posterior chain.' }, sets: 5, reps: '1 minute on, 30 seconds off', isCompleted: false },
        ],
      },
    ],
  },
];
