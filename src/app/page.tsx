'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Role } from '@/lib/types';
import { Dumbbell } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (role: Role) => {
    // In a real app, you'd perform authentication here
    // For this demo, we'll use localStorage to mock the session
    const user = {
      name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      email: `${role.toLowerCase()}@olimpo.fit`,
      role: role,
    };
    localStorage.setItem('user', JSON.stringify(user));
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="bg-primary rounded-full p-4 mb-4">
            <Dumbbell className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-primary-foreground">
          OlimpoFit
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Forge Your Strength. Define Your Legacy.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Access Portal</CardTitle>
          <CardDescription>
            Select your role to enter the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button
            className="w-full"
            onClick={() => handleLogin(Role.Admin)}
          >
            Continue as Administrator
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleLogin(Role.Analyst)}
          >
            Continue as Analyst
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleLogin(Role.Athlete)}
          >
            Continue as Athlete
          </Button>
        </CardContent>
      </Card>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} OlimpoFit. All rights reserved.
      </footer>
    </div>
  );
}
