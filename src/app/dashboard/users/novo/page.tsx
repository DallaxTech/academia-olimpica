'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Role } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function NewUserPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    temporaryPassword: '',
    roleId: Role.Athlete,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    setLoading(true);

    try {
      // Create a document with a random ID
      // In a real app with Auth, you'd likely create the Auth user first
      // or use a specific joining process. For this interface, we create the profile.
      const newUserId = `user_${Math.random().toString(36).substring(2, 15)}`;
      const userProfile = {
        id: newUserId,
        ...formData,
        mustChangePassword: !!formData.temporaryPassword,
        registrationDate: new Date().toISOString(),
      };

      await setDoc(doc(firestore, 'userProfiles', newUserId), userProfile);
      router.push('/dashboard/users');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erro ao criar usuário. Verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageHeader 
          title="Novo Usuário" 
          description="Cadastre um novo aluno ou professor no sistema."
        />
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <UserPlus className="h-5 w-5" />
                Dados do Perfil
            </CardTitle>
            <CardDescription>
                Preencha as informações básicas para criar o perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input 
                  id="firstName" 
                  placeholder="Ex: João" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-background/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input 
                  id="lastName" 
                  placeholder="Ex: Silva" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-background/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@exemplo.com" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempPassword">Senha Temporária</Label>
              <Input 
                id="tempPassword" 
                type="text" 
                placeholder="Ex: 123456" 
                value={formData.temporaryPassword}
                onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                className="bg-background/50 border-dashed border-primary/30"
              />
              <p className="text-xs text-muted-foreground pt-1">
                Se definida, o usuário será solicitado a trocá-la no primeiro acesso.
              </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Nível de Acesso</Label>
                <Select 
                  value={formData.roleId} 
                  onValueChange={(value) => setFormData({ ...formData, roleId: value as Role })}
                >
                    <SelectTrigger id="role" className="bg-background/50">
                        <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={Role.Athlete}>Aluno (Atleta)</SelectItem>
                        <SelectItem value={Role.Professor}>Professor</SelectItem>
                        <SelectItem value={Role.Analyst}>Analista</SelectItem>
                        <SelectItem value={Role.Admin}>Administrador</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground pt-1">
                  Somente Administradores podem alterar permissões posteriormente.
                </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-muted/30">
             <Button variant="ghost" type="button" onClick={() => router.back()}>
                Cancelar
             </Button>
             <Button type="submit" disabled={loading} className="px-8 shadow-lg shadow-primary/20">
                {loading ? 'Salvando...' : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Criar Usuário
                    </>
                )}
             </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
