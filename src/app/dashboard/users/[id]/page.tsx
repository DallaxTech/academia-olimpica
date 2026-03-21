'use client';

import { doc } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Role, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';


export default function UserProfilePage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'userProfiles', params.id);
  }, [firestore, params.id]);

  const { data: user, isLoading } = useDoc<UserProfile>(userDocRef);

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
      <PageHeader title="Perfil do Usuário" />
       {isLoading ? (
          <Card>
          <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
          </CardHeader>
          <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-5 w-full" />
                  </div>
                  <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-5 w-full" />
                  </div>
              </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-5 w-full" />
              </div>
          </CardContent>
        </Card>
      ) : user ? (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback><UserIcon className="h-8 w-8" /></AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">{`${user.firstName} ${user.lastName}`}</CardTitle>
                    <CardDescription>
                        <Badge variant={getRoleVariant(user.roleId)}>{user.roleId}</Badge>
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p>{user.email}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Data de Registro</p>
                        <p>{new Date(user.registrationDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID do Usuário</p>
                    <p className="font-mono text-xs">{user.id}</p>
                </div>
            </CardContent>
        </Card>
      ) : (
        <Card className="flex items-center justify-center h-48">
          <p>Usuário não encontrado.</p>
        </Card>
      )}
    </>
  );
}
