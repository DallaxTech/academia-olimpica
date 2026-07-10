'use client';

import { useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Role, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Search } from 'lucide-react';
import { useLayout } from '@/components/layout-provider';
import { Input } from '@/components/ui/input';

export default function AlunosPage() {
  const firestore = useFirestore();
  const { layout } = useLayout();
  const [searchTerm, setSearchTerm] = useState('');
  
  const athletesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'userProfiles'), where('roleId', '==', Role.Athlete));
  }, [firestore]);

  const { data: athletes, isLoading } = useCollection<UserProfile>(athletesCollectionRef);

  const filteredAthletes = athletes?.filter(u => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  }) || [];

  return (
    <>
      <PageHeader
        title="Central de Alunos"
        description="Acompanhe a evolução, anamneses, treinos e exames médicos dos seus alunos."
      />
      
      <div className="relative max-w-sm mb-6 mt-2">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar aluno por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-background/50 border-primary/10 focus-visible:ring-primary"
        />
      </div>
      
      {layout === 'list' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Data de Registro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAthletes && filteredAthletes.length > 0 ? (
                filteredAthletes.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.registrationDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/alunos/${user.id}`}>Acompanhar Evolução</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum aluno encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))
          ) : filteredAthletes && filteredAthletes.length > 0 ? (
            filteredAthletes.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                              <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={`${user.firstName} ${user.lastName}`} />
                              <AvatarFallback><UserIcon className="h-6 w-6" /></AvatarFallback>
                          </Avatar>
                          <div className="truncate">
                            <CardTitle className="text-lg truncate">{`${user.firstName} ${user.lastName}`}</CardTitle>
                            <CardDescription className="truncate">{user.email}</CardDescription>
                          </div>
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/alunos/${user.id}`}>Acompanhar Evolução</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full flex items-center justify-center h-48">
              <p>Nenhum aluno encontrado.</p>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
