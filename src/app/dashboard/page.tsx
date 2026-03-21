'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Role, type User } from '@/lib/types';
import { users, workouts } from '@/lib/data';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const totalAthletes = users.filter(u => u.role === Role.Athlete).length;
  const totalWorkouts = workouts.length;
  
  const assignedWorkouts = user?.role === Role.Athlete 
    ? workouts.filter(w => w.assignedTo.includes(user.id)).length
    : 0;
  
  const performanceData = [
    { name: "Strength", value: user?.performanceMetrics?.strength || 0 },
    { name: "Cardio", value: user?.performanceMetrics?.cardio || 0 },
    { name: "Flexibility", value: user?.performanceMetrics?.flexibility || 0 },
  ];

  if (!user) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(' ')[0]}!`}
        description="Here's a snapshot of your current status."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {user.role !== Role.Athlete && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Athletes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAthletes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Workout Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWorkouts}</div>
              </CardContent>
            </Card>
          </>
        )}

        {user.role === Role.Athlete && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedWorkouts}</div>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={performanceData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
