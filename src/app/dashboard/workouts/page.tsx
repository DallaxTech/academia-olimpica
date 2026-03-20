'use client';

import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { workouts, users } from '@/lib/data';
import type { Role, User } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

export default function WorkoutsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) return null;

  if (user.role === 'athlete') {
    return <AthleteWorkoutView userId={user.id} />;
  }

  return <AdminWorkoutView />;
}

const AthleteWorkoutView = ({ userId }: { userId: string }) => {
  const athleteWorkouts = workouts.filter((w) => w.assignedTo.includes(userId));

  const calculateProgress = (workout: (typeof workouts)[0]) => {
    const totalExercises = workout.days.reduce((acc, day) => acc + day.exercises.length, 0);
    const completedExercises = workout.days.reduce((acc, day) => {
      return acc + day.exercises.filter(ex => ex.isCompleted).length;
    }, 0);
    return totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
  };
  
  return (
    <>
      <PageHeader
        title="My Workouts"
        description="Your assigned training plans. Stay consistent!"
      />
      {athleteWorkouts.length > 0 ? (
        <div className="space-y-6">
          {athleteWorkouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader>
                <CardTitle>{workout.name}</CardTitle>
                <CardDescription>{workout.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-primary">Progress</span>
                    <span className="text-sm font-medium text-primary">{Math.round(calculateProgress(workout))}%</span>
                  </div>
                  <Progress value={calculateProgress(workout)} className="h-2" />
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {workout.days.map((day) => (
                    <AccordionItem value={`day-${day.day}`} key={day.day}>
                      <AccordionTrigger>
                        Day {day.day}: {day.name}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-4">
                          {day.exercises.map((ex, index) => (
                            <li key={index} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                                <div className="flex items-center space-x-4">
                                    <Checkbox id={`ex-${workout.id}-${day.day}-${index}`} />
                                    <div>
                                        <label htmlFor={`ex-${workout.id}-${day.day}-${index}`} className="font-medium">{ex.exercise.name}</label>
                                        <p className="text-sm text-muted-foreground">{ex.sets} sets x {ex.reps} reps</p>
                                    </div>
                                </div>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No workouts assigned yet. Please contact your analyst.</p>
      )}
    </>
  );
};

const AdminWorkoutView = () => {
    const getAthleteNames = (athleteIds: string[]) => {
        return athleteIds.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ');
    }

  return (
    <>
      <PageHeader
        title="Workout Management"
        description="Create, assign, and manage all workout plans."
      >
        <Button>Create New Plan</Button>
      </PageHeader>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Assigned Athletes</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workouts.map((workout) => (
              <TableRow key={workout.id}>
                <TableCell className="font-medium">{workout.name}</TableCell>
                <TableCell className="max-w-[300px] truncate">{workout.description}</TableCell>
                <TableCell>
                    <Badge variant="outline">{getAthleteNames(workout.assignedTo) || 'Unassigned'}</Badge>
                </TableCell>
                <TableCell>{workout.days.length}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Assign</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
