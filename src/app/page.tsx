'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { Role } from '@/lib/types';

const signInSchema = z.object({
  email: z.string().email({ message: 'Endereço de e-mail inválido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

const signUpSchema = z.object({
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  email: z.string().email({ message: 'Endereço de e-mail inválido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

export default function AuthPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Check for mandatory password change
      const userDoc = await getDoc(doc(firestore, 'userProfiles', user.uid));
      const profileData = userDoc.data();
      
      if (profileData?.mustChangePassword) {
        router.push('/dashboard/trocar-senha');
        return;
      }

      // Ensure the master admin has the correct role
      let finalRole = profileData?.roleId || Role.Athlete;
      if (values.email === 'grupodallax@gmail.com') {
        finalRole = Role.Admin;
        await setDoc(doc(firestore, 'userProfiles', user.uid), { roleId: Role.Admin }, { merge: true });
      }

      const redirectPath = finalRole === Role.Athlete ? '/aluno' : '/dashboard';
      router.push(redirectPath);
    } catch (error: any) {
      // Auto-registration logic for temporary passwords
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          const { query, collection, where, getDocs } = await import('firebase/firestore');
          const usersRef = collection(firestore!, 'userProfiles');
          const q = query(usersRef, where('email', '==', values.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const profileDoc = querySnapshot.docs[0];
            const profileData = profileDoc.data();
            
            if (profileData.temporaryPassword && profileData.temporaryPassword === values.password) {
              // Create the auth user automatically
              const newUserCred = await createUserWithEmailAndPassword(auth, values.email, values.password);
              
              // Map the profile to the new UID
              const oldId = profileDoc.id;
              const newId = newUserCred.user.uid;
              
              if (oldId !== newId) {
                const { deleteDoc } = await import('firebase/firestore');
                await setDoc(doc(firestore!, 'userProfiles', newId), { ...profileData, id: newId });
                await deleteDoc(doc(firestore!, 'userProfiles', oldId));
              }

              toast({
                title: 'Primeiro Acesso Detectado',
                description: 'Por favor, siga para a troca de senha obrigatória.',
              });
              
              router.push('/dashboard/trocar-senha');
              return;
            }
          }
        } catch (innerError: any) {
          console.error('Auto-reg error:', innerError);
        }
      }

      toast({
        variant: 'destructive',
        title: 'Falha ao Entrar',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const email = signInForm.getValues('email');
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'E-mail necessário',
        description: 'Digite seu e-mail no campo acima antes de clicar em Esqueci a senha.',
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'E-mail Enviado!',
        description: 'Verifique sua caixa de entrada (e o Spam) para criar uma nova senha.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar e-mail',
        description: error.message,
      });
    }
  };

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      const role = values.email === 'grupodallax@gmail.com' ? Role.Admin : Role.Athlete;

      // Create user profile in Firestore
      const userProfile = {
        id: user.uid,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        roleId: role,
        registrationDate: new Date().toISOString(),
      };

      await setDoc(doc(firestore, 'userProfiles', user.uid), userProfile);
      
      const redirectPath = role === Role.Admin ? '/dashboard' : '/aluno';
      router.push(redirectPath);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha ao Cadastrar',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      router.push('/aluno');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha no Login Anônimo',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
       <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-5xl font-bold font-headline text-primary-foreground">
          Olimpo
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Um App da Academia Olímpica
        </p>
      </div>

      <Tabs defaultValue="signin" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Entrar</TabsTrigger>
          <TabsTrigger value="signup">Cadastrar</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
              <CardDescription>
                Acesse sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="m@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full text-xs text-muted-foreground mt-2" 
                    onClick={handleResetPassword}
                  >
                    Esqueci minha senha
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar</CardTitle>
              <CardDescription>
                Crie sua conta para começar sua jornada fitness.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <div className="flex gap-4">
                    <FormField
                      control={signUpForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="João" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Sobrenome</FormLabel>
                          <FormControl>
                            <Input placeholder="Silva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="m@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cadastrar
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        <div className="mt-4 text-center text-sm text-muted-foreground">
            Ou
        </div>
         <Button
            variant="outline"
            className="w-full max-w-sm mt-4"
            onClick={handleAnonymousSignIn}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar como Convidado
        </Button>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Olimpo. Todos os direitos reservados.
      </footer>
    </div>
  );
}
