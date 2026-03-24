'use client';

import { use } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Role, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const firestore = useFirestore();
  const { id } = use(params);
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  
  const currentUserDocRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, 'userProfiles', currentUser.uid);
  }, [firestore, currentUser]);
  
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserDocRef);
  const isAdmin = currentUserProfile?.roleId === Role.Admin;
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'userProfiles', id);
  }, [firestore, id]);

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

  const handleRoleChange = async (newRole: Role) => {
    if (!firestore || !id) return;
    try {
      const ref = doc(firestore, 'userProfiles', id);
      await updateDoc(ref, { roleId: newRole });
      toast({ title: 'Acesso Atualizado', description: `Permissões alteradas para ${newRole}.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message });
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
                  <div className="pt-4 border-t mt-4 grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Acesso do Usuário (Função)</p>
                      <Select 
                         defaultValue={user.roleId} 
                         onValueChange={(val) => handleRoleChange(val as Role)}
                         disabled={!isAdmin}
                      >
                         <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Selecione a função" />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value={Role.Athlete}>Aluno (Atleta)</SelectItem>
                            <SelectItem value={Role.Professor}>Professor</SelectItem>
                            <SelectItem value={Role.Admin}>Administrador</SelectItem>
                            <SelectItem value={Role.Analyst}>Analista</SelectItem>
                         </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2 max-w-[250px]">
                         {isAdmin ? 'Altere a permissão deste usuário no sistema.' : 'Apenas Administradores podem alterar os papéis.'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ID do Banco de Dados</p>
                      <p className="font-mono text-xs mt-1">{user.id}</p>
                    </div>
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
