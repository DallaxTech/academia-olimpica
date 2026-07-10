'use client';

import { useState, use } from 'react';
import { doc, updateDoc, collection, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { Role, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Dumbbell, PlusCircle, Trash2, ArrowRight, Loader2, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { BioimpedanceSheet } from '@/components/bioimpedance-sheet';
import { LimitationsCard } from '@/components/limitations-card';
import { WorkoutAdaptationSheet } from '@/components/workout-adaptation-sheet';


function getGenderInfo(plan: { gender?: string; name?: string; description?: string }) {
  const gender = plan.gender?.toLowerCase();
  const name = plan.name?.toLowerCase() || '';
  const desc = plan.description?.toLowerCase() || '';

  if (gender === 'male' || name.includes('masculino') || name.includes('homem') || desc.includes('masculino')) {
    return {
      label: 'Masculino',
      class: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 8a4 4 0 11-8 0 4 4 0 018 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z" />
        </svg>
      )
    };
  }

  if (gender === 'female' || name.includes('feminino') || name.includes('mulher') || desc.includes('feminino')) {
    return {
      label: 'Feminino',
      class: 'bg-accent/15 text-accent border-accent/25 hover:bg-accent/20',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a5 5 0 100-10 5 5 0 000 10zM12 11v9M9 16h6" />
        </svg>
      )
    };
  }

  return {
    label: 'Personalizado',
    class: 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
    icon: (
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  };
}

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
        <div className="space-y-6">
          <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-16 w-16">
                      <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback><UserIcon className="h-8 w-8" /></AvatarFallback>
                  </Avatar>
                  <div>
                      <CardTitle className="text-2xl">{`${user.firstName} ${user.lastName}`}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant={getRoleVariant(user.roleId)}>{user.roleId}</Badge>
                          {user.roleId === Role.Athlete && (
                            <>
                              <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
                                <a href={`/dashboard/users/${id}/anamnese`}>
                                  <Activity className="w-3.5 h-3.5 mr-1" />
                                  Ver Anamnese
                                </a>
                              </Button>
                              <span className="text-muted-foreground text-xs">•</span>
                              <BioimpedanceSheet athleteId={user.id} athleteName={`${user.firstName} ${user.lastName}`} />
                            </>
                          )}
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

          {/* New Section: Assigned Workouts */}
          {user.roleId === Role.Athlete && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <WorkoutAssignmentSection athleteId={user.id} />
              </div>
              <div>
                <LimitationsCard athleteId={user.id} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="flex items-center justify-center h-48">
          <p>Usuário não encontrado.</p>
        </Card>
      )}
    </>
  );
}

function WorkoutAssignmentSection({ athleteId }: { athleteId: string }) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);

  // Fetch all training plans created by this professor
  const allPlansQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'trainingPlans'), where('createdByUserId', '==', currentUser.uid));
  }, [firestore, currentUser]);

  const { data: allPlans, isLoading: loadingPlans } = useCollection(allPlansQuery);

  // Filter plans assigned to THIS athlete
  const assignedPlans = allPlans?.filter((plan: any) => 
    plan.assignedToAthleteIds?.includes(athleteId)
  ) || [];

  // Plans NOT YET assigned to this athlete
  const availablePlans = allPlans?.filter((plan: any) => 
    !plan.assignedToAthleteIds?.includes(athleteId)
  ) || [];

  const handleLinkPlan = async () => {
    if (!firestore || !selectedPlanId || selectedPlanId === 'none') return;
    setIsLinking(true);
    try {
      const planRef = doc(firestore, 'trainingPlans', selectedPlanId);
      await updateDoc(planRef, {
        assignedToAthleteIds: arrayUnion(athleteId)
      });
      
      toast({ title: 'Treino Vinculado', description: 'O aluno agora tem acesso a esta ficha.' });
      setSelectedPlanId('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao vincular', description: e.message });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkPlan = async (planId: string) => {
    if (!firestore) return;
    try {
      const planRef = doc(firestore, 'trainingPlans', planId);
      await updateDoc(planRef, {
        assignedToAthleteIds: arrayRemove(athleteId)
      });
      toast({ title: 'Treino Removido', description: 'A ficha foi desvinculada deste aluno.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Vincular Novo Plano
          </CardTitle>
          <CardDescription>Atribua um plano de treinamento para este aluno.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um treino..." />
            </SelectTrigger>
            <SelectContent>
              {availablePlans.length > 0 ? (
                availablePlans.map((plan: any) => (
                  <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>Nenhum treino disponível</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button onClick={handleLinkPlan} disabled={!selectedPlanId || selectedPlanId === 'none' || isLinking}>
            {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
            Vincular
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          Treinos Atuais ({assignedPlans.length})
        </h3>
        {loadingPlans ? (
          <Skeleton className="h-24 w-full" />
        ) : assignedPlans.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {assignedPlans.map((plan: any) => (
              <Card key={plan.id} className="group overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold">{plan.name}</h4>
                        {(() => {
                          const info = getGenderInfo(plan);
                          return (
                            <Badge variant="outline" className={`${info.class} text-[10px] py-0 px-1.5 h-4 flex items-center shrink-0`}>
                              {info.label}
                            </Badge>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.daysCount || 0} dias de treino</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <WorkoutAdaptationSheet 
                      athleteId={athleteId}
                      planId={plan.id}
                      planName={plan.name}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/workouts/${plan.id}`} target="_blank" rel="noreferrer">
                        Ver Ficha <ArrowRight className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleUnlinkPlan(plan.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm text-center py-8 border-2 border-dashed rounded-xl">
             Nenhum treino vinculado a este aluno ainda.
          </p>
        )}
      </div>
    </div>
  );
}
