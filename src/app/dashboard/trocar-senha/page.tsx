'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ChangePasswordPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !firestore || !user) return;

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não coincidem',
        description: 'As senhas digitadas são diferentes.',
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Update password in Firebase Auth
      await updatePassword(auth.currentUser, newPassword);

      // 2. Remove flags from Firestore
      await updateDoc(doc(firestore, 'userProfiles', user.uid), {
        mustChangePassword: false,
        temporaryPassword: deleteField(),
      });

      toast({
        title: 'Senha Atualizada!',
        description: 'Sua conta está segura agora. Redirecionando...',
      });

      // 3. Redirect to dashboard or student home
      router.push('/'); // Go back to root to trigger the role-based redirect
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar senha',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Definir Nova Senha</CardTitle>
          <CardDescription>
            Este é seu primeiro acesso com uma senha temporária. Por favor, crie uma senha segura para continuar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="******"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="******"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6 text-center">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Confirmar Nova Senha
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Sua nova senha deve ter no mínimo 6 caracteres.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
