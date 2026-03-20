'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { users } from '@/lib/data';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const foundUser = users.find(u => u.id === params.id);
    setUser(foundUser || null);
  }, [params.id]);

  if (!user) {
    return <div>User not found.</div>;
  }
  
  const performanceData = user.performanceMetrics ? Object.entries(user.performanceMetrics).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })) : [];
  const userAvatar = PlaceHolderImages.find(img => img.id === user.avatar);

  return (
    <>
      <PageHeader title="Athlete Profile" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={userAvatar?.imageUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="font-headline">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                    <Badge className="mt-2">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
                </CardHeader>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Goals</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{user.goals || 'No goals set.'}</p>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>A summary of the athlete's key performance areas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="value" fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Historical Data Summary</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground">{user.historicalData || 'No historical data available.'}</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
