import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowRight, Zap as BoltIcon, CalendarClock, Bot, LayoutDashboard, Check, Star, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { useTheme } from 'next-themes';
import { motion } from 'motion/react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setTheme('light');
    }
  }, [user, navigate, setTheme]);

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
    } catch (error: any) {
      toast.error('Erro ao fazer login com Google: ' + error.message);
      setIsLoading(false);
    }
  };

  const handleScrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsRegistering(true); // Default to register when clicking CTA
  };

  const pbVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-500/30 text-slate-900">
      
      {/* HERO SECTION */}
      <div className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop" 
            alt="Professora na sala de aula" 
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-blue-950/80 bg-gradient-to-t from-slate-50 via-blue-950/60 to-blue-950/90 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
            <motion.h1 variants={pbVariant} className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Crie provas e organize sua turma em <span className="text-blue-400">minutos</span>
            </motion.h1>
            <motion.p variants={pbVariant} className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto font-light">
              Uma plataforma simples e inteligente para professores modernos
            </motion.p>
            <motion.div variants={pbVariant}>
              <Button 
                onClick={handleScrollToLogin}
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-10 py-7 text-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105"
              >
                Começar agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* BENEFITS SECTION */}
      <div className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Trabalhe de forma inteligente</h2>
            <p className="mt-4 text-lg text-slate-600">Automatize tarefas repetitivas e foque no que importa: ensinar.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: BoltIcon, title: "Criação rápida", desc: "Gere provas completas com gabarito em poucos segundos.", color: "text-amber-500", bg: "bg-amber-100" },
              { icon: CalendarClock, title: "Cronograma", desc: "Monte o planejamento do semestre com apenas alguns cliques.", color: "text-blue-500", bg: "bg-blue-100" },
              { icon: Bot, title: "IA Integrada", desc: "Questões criativas e de alta qualidade geradas por IA.", color: "text-purple-500", bg: "bg-purple-100" },
              { icon: LayoutDashboard, title: "Organização", desc: "Todos os seus materiais salvos e classificados em um só lugar.", color: "text-emerald-500", bg: "bg-emerald-100" },
            ].map((benefit, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${benefit.bg} ${benefit.color} mb-6`}>
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* PLANS SECTION */}
      <div className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Planos sob medida para você</h2>
            <p className="mt-4 text-lg text-slate-600">Escolha o plano ideal para suas necessidades.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-4 flex items-center gap-2">
                <Star className="text-slate-500" size={24} />
                <h3 className="text-xl font-bold text-slate-900">Básico</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">Grátis</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600"><Check size={18} className="text-slate-400" /> 2 provas por mês</li>
                <li className="flex items-center gap-3 text-slate-600"><Check size={18} className="text-slate-400" /> Suporte básico</li>
              </ul>
              <Button onClick={handleScrollToLogin} variant="outline" className="w-full rounded-xl">Começar grátis</Button>
            </motion.div>

            {/* Pago */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-blue-600 rounded-3xl p-8 shadow-xl flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 inset-x-0 transform -translate-y-1/2 flex justify-center">
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-sm">Mais popular</span>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <Zap className="text-blue-200" size={24} />
                <h3 className="text-xl font-bold text-white">Profissional</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">R$ 29</span><span className="text-blue-200">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-blue-50"><Check size={18} className="text-blue-300" /> 5 provas por mês</li>
                <li className="flex items-center gap-3 text-blue-50"><Check size={18} className="text-blue-300" /> Histórico avançado</li>
                <li className="flex items-center gap-3 text-blue-50"><Check size={18} className="text-blue-300" /> Suporte prioritário</li>
              </ul>
              <Button onClick={() => window.open('https://wa.me/5548988028756', '_blank')} className="w-full rounded-xl bg-white text-blue-600 hover:bg-slate-50">Escolher plano</Button>
            </motion.div>

            {/* Deluxe */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-slate-900 rounded-3xl p-8 border border-amber-500/20 shadow-xl flex flex-col">
               <div className="mb-4 flex items-center gap-2">
                <Crown className="text-amber-500" size={24} />
                <h3 className="text-xl font-bold text-white">Deluxe</h3>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">R$ 69</span><span className="text-slate-400">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-amber-500" /> 10 provas por mês</li>
                <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-amber-500" /> Modelo mais rápido</li>
                <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-amber-500" /> Suporte WhatsApp 24/7</li>
              </ul>
              <Button onClick={() => window.open('https://wa.me/5548988028756', '_blank')} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500 font-bold border-none">Obter Deluxe</Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* LOGIN/REGISTER SECTION */}
      <div ref={loginRef} className="py-24 bg-white flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative"
        >
          <div className="flex justify-center mb-10 group relative">
            <div className="absolute inset-0 bg-blue-100 blur-xl opacity-50 rounded-full scale-150 transition-all group-hover:scale-110"></div>
            <div className="relative">
               <Logo iconSize="h-14 w-14" textSize="text-5xl text-slate-900 font-extrabold tracking-tight" />
            </div>
          </div>

          <Tabs defaultValue="teacher" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="teacher" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sou Professor</TabsTrigger>
              <TabsTrigger value="student" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sou Aluno</TabsTrigger>
            </TabsList>
            
            {/* Teacher Tab */}
            <TabsContent value="teacher">
              <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl overflow-hidden ring-1 ring-slate-200">
                <CardHeader className="bg-slate-50/50 pb-8 pt-8">
                  <CardTitle className="text-2xl text-center font-bold text-slate-900">
                    {isRegistering ? 'Nova conta docente' : 'Bem-vindo de volta'}
                  </CardTitle>
                  <CardDescription className="text-center text-slate-500">
                    {isRegistering ? 'Crie sua conta e otimize seu tempo.' : 'Acesse o painel integrado.'}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={(e) => handleEmailAuth(e, 'teacher')} className="px-6 pb-8 bg-white">
                  <CardContent className="space-y-4 px-0 pt-4">
                    {isRegistering && (
                      <div className="space-y-2">
                        <Label htmlFor="teacher-name" className="text-slate-700 font-medium">Nome Completo</Label>
                        <Input 
                          id="teacher-name" 
                          type="text" 
                          placeholder="Prof. João da Silva" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={isRegistering} 
                          className="rounded-xl h-12 focus-visible:ring-blue-500 bg-slate-50"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="teacher-email" className="text-slate-700 font-medium">E-mail</Label>
                      <Input 
                        id="teacher-email" 
                        type="email" 
                        placeholder="professor@escola.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="rounded-xl h-12 focus-visible:ring-blue-500 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher-password" className="text-slate-700 font-medium">Senha</Label>
                      <Input 
                        id="teacher-password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="rounded-xl h-12 focus-visible:ring-blue-500 bg-slate-50"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 px-0 pt-2">
                    <Button type="submit" className="w-full text-base h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium shadow-sm" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                      {isRegistering ? 'Criar minha conta' : 'Entrar na plataforma'}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-sm text-slate-500 hover:text-blue-600 hover:bg-transparent" onClick={() => setIsRegistering(!isRegistering)}>
                      {isRegistering ? 'Já possui conta? Iniciar sessão' : 'Ainda não tem conta? Clique aqui'}
                    </Button>
                    
                    <div className="relative w-full my-3">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase font-medium">
                        <span className="bg-white px-3 text-slate-400">Ou continuar com</span>
                      </div>
                    </div>

                    <Button type="button" variant="outline" className="w-full h-12 rounded-xl shadow-sm border-slate-200 text-slate-700 font-medium hover:bg-slate-50" onClick={() => handleGoogleLogin('teacher')} disabled={isLoading}>
                      <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Conta Google
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* Student Tab */}
            <TabsContent value="student">
              <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl overflow-hidden ring-1 ring-slate-200">
                <CardHeader className="bg-slate-50/50 pb-8 pt-8">
                  <CardTitle className="text-2xl text-center font-bold text-slate-900">
                    {isRegistering ? 'Cadastro de Estudante' : 'Portal do Aluno'}
                  </CardTitle>
                  <CardDescription className="text-center text-slate-500">
                    {isRegistering ? 'Inscreva-se para acessar suas tarefas.' : 'Entre para visualizar suas provas.'}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={(e) => handleEmailAuth(e, 'student')} className="px-6 pb-8 bg-white">
                  <CardContent className="space-y-4 px-0 pt-4">
                    {isRegistering && (
                      <div className="space-y-2">
                        <Label htmlFor="student-name" className="text-slate-700 font-medium">Nome Completo</Label>
                        <Input 
                          id="student-name" 
                          type="text" 
                          placeholder="Maria Souza" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={isRegistering} 
                          className="rounded-xl h-12 focus-visible:ring-blue-500 bg-slate-50"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="student-email" className="text-slate-700 font-medium">E-mail</Label>
                      <Input 
                        id="student-email" 
                        type="email" 
                        placeholder="aluno@escola.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="rounded-xl h-12 focus-visible:ring-blue-500 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-password" className="text-slate-700 font-medium">Senha</Label>
                      <Input 
                        id="student-password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        className="rounded-xl h-12 focus-visible:ring-blue-500 bg-slate-50"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 px-0 pt-2">
                    <Button type="submit" className="w-full text-base h-12 bg-slate-800 hover:bg-slate-900 rounded-xl font-medium shadow-sm" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                      {isRegistering ? 'Criar minha conta' : 'Entrar'}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-sm text-slate-500 hover:text-slate-800 hover:bg-transparent" onClick={() => setIsRegistering(!isRegistering)}>
                      {isRegistering ? 'Já possui conta? Iniciar sessão' : 'Criar uma conta nova'}
                    </Button>
                    
                    <div className="relative w-full my-3">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase font-medium">
                        <span className="bg-white px-3 text-slate-400">Ou continuar com</span>
                      </div>
                    </div>

                    <Button type="button" variant="outline" className="w-full h-12 rounded-xl shadow-sm border-slate-200 text-slate-700 font-medium hover:bg-slate-50" onClick={() => handleGoogleLogin('student')} disabled={isLoading}>
                      <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Conta Google
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-white mb-6">Precisa de ajuda ou quer saber mais?</h3>
          <Button onClick={() => window.open('https://wa.me/5548988028756', '_blank')} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white mb-12 rounded-full px-8 h-12">
            Entrar em contato
          </Button>
          <div className="border-t border-slate-800 pt-8 mt-4 flex flex-col items-center">
            <div className="mb-6 opacity-50 grayscale">
              <Logo iconSize="h-8 w-8" textSize="text-2xl text-slate-400" />
            </div>
            <p className="text-sm">© 2026 Intellixy - Todos os direitos reservados</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

