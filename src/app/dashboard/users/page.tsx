'use client';

import { collection } from 'firebase/firestore';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from 'lucide-react';
import { useLayout } from '@/components/layout-provider';

export default function UsersPage() {
  const firestore = useFirestore();
  const { layout } = useLayout();
  
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'userProfiles');
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersCollectionRef);

  const getRoleVariant = (roleId: Role) => {
    switch (roleId) {
      case Role.Admin:
        return 'destructive';
      case Role.Analyst:
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Visualize e gerencie todos os usuários no sistema."
      >
        <Button asChild>
          <Link href="/dashboard/users/novo">Adicionar Usuário</Link>
        </Button>
      </PageHeader>
      
      {layout === 'list' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleVariant(user.roleId)}>{user.roleId}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.registrationDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/users/${user.id}`}>Ver Perfil</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum usuário encontrado.
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
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))
          ) : users && users.length > 0 ? (
            users.map((user) => (
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
                <CardContent className="flex items-center justify-between">
                  <Badge variant={getRoleVariant(user.roleId)}>{user.roleId}</Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/users/${user.id}`}>Ver Perfil</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full flex items-center justify-center h-48">
              <p>Nenhum usuário encontrado.</p>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
