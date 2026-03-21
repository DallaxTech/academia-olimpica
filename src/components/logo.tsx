import { Dumbbell } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Dumbbell className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-bold font-headline text-primary-foreground">
        Olimpo App
      </h1>
    </div>
  );
}

    