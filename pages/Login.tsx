import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        navigate('/dev');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent, role: 'student' | 'teacher') => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !name)) {
      toast.error('Preencha todos os campos.');
      return;
    }
    
    setIsLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(name, email, password, role);
        toast.success('Conta criada com sucesso!');
      } else {
        await loginWithEmail(email, password);
        toast.success('Login realizado com sucesso!');
      }
      // do not navigate here, let useEffect handle it when user object is populated
    } catch (error: any) {
      if (!isRegistering && (error.code === 'auth/invalid-credential' || error.message.includes('auth/invalid-credential'))) {
        if (email.toLowerCase() === 'patinpola123ez@gmail.com') {
          try {
            await registerWithEmail('Administrador', email, password, role);
            toast.success('Login administrativo realizado com sucesso!');
            return;
          } catch(regError: any) {
             if (regError.code === 'auth/email-already-in-use') {
                toast.error('Essa conta já existe, mas a senha está incorreta. Se você a criou com o Google, use o botão Entrar com Google abaixo.');
             } else {
                toast.error('Erro ao autenticar admin: ' + regError.message);
             }
          }
        } else {
          toast.error('Essa conta não existe ou senha incorreta. Se você usou o Google, tente clicar em Google abaixo.');
        }
      } else {
        toast.error((isRegistering ? 'Erro ao criar conta: ' : 'Erro ao fazer login: ') + error.message);
      }
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (role: 'student' | 'teacher') => {
    setIsLoading(true);
    try {
      await loginWithGoogle(role);
      // do not navigate here, let useEffect handle it when user object is populated
    } catch (error: any) {
      toast.error('Erro ao fazer login com Google: ' + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo iconSize="h-12 w-12" textSize="text-4xl" />
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="student">Sou Aluno</TabsTrigger>
            <TabsTrigger value="teacher">Sou Professor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="student">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle>{isRegistering ? 'Cadastro de Aluno' : 'Login de Aluno'}</CardTitle>
                <CardDescription>
                  {isRegistering ? 'Crie sua conta para começar.' : 'Acesse seu painel de estudos.'}
                </CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleEmailAuth(e, 'student')}>
                <CardContent className="space-y-4">
                  {isRegistering && (
                    <div className="space-y-2">
                      <Label htmlFor="student-name">Nome Completo</Label>
                      <Input 
                        id="student-name" 
                        type="text" 
                        placeholder="João da Silva" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={isRegistering} 
                        className="focus-visible:ring-blue-500"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email</Label>
                    <Input 
                      id="student-email" 
                      type="email" 
                      placeholder="aluno@escola.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      className="focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Senha</Label>
                    <Input 
                      id="student-password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      className="focus-visible:ring-blue-500"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full text-[15px] h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    {isRegistering ? 'Cadastrar' : 'Entrar'}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full text-sm hover:text-indigo-700" onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
                  </Button>
                  
                  <div className="relative w-full my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">Ou continue com</span>
                    </div>
                  </div>

                  <Button type="button" variant="outline" className="w-full h-12 shadow-sm font-medium hover:bg-slate-50" onClick={() => handleGoogleLogin('student')} disabled={isLoading}>
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="teacher">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle>{isRegistering ? 'Cadastro de Professor' : 'Login de Professor'}</CardTitle>
                <CardDescription>
                  {isRegistering ? 'Crie sua conta docente.' : 'Acesse o painel de gerenciamento.'}
                </CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleEmailAuth(e, 'teacher')}>
                <CardContent className="space-y-4">
                  {isRegistering && (
                    <div className="space-y-2">
                      <Label htmlFor="teacher-name">Nome Completo</Label>
                      <Input 
                        id="teacher-name" 
                        type="text" 
                        placeholder="Prof. João da Silva" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={isRegistering} 
                        className="focus-visible:ring-blue-500"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="teacher-email">Email Institucional</Label>
                    <Input 
                      id="teacher-email" 
                      type="email" 
                      placeholder="professor@escola.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      className="focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-password">Senha</Label>
                    <Input 
                      id="teacher-password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      className="focus-visible:ring-blue-500"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full text-[15px] h-12" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    {isRegistering ? 'Cadastrar' : 'Entrar'}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full text-sm hover:text-indigo-700" onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
                  </Button>

                  <div className="relative w-full my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">Ou continue com</span>
                    </div>
                  </div>

                  <Button type="button" variant="outline" className="w-full h-12 shadow-sm font-medium hover:bg-slate-50" onClick={() => handleGoogleLogin('teacher')} disabled={isLoading}>
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
