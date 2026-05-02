import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, FileText, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  subject: string;
  type: 'exam' | 'task' | 'meeting';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ exams: 0, tasks: 0, meetings: 0 });

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData: Event[] = [];
      let exams = 0;
      let tasks = 0;
      let meetings = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as Event;
        eventsData.push({ id: doc.id, ...data });
        if (data.type === 'exam') exams++;
        if (data.type === 'task') tasks++;
        if (data.type === 'meeting') meetings++;
      });
      
      // Sort by time in memory to avoid requiring a composite index
      eventsData.sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return 0;
      });

      setUpcomingEvents(eventsData.slice(0, 5));
      setStats({ exams, tasks, meetings });
    });

    return () => unsubscribe();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Olá, {user?.name}!</h1>
        <p className="text-slate-500 mt-1">Bem-vindo ao seu painel do Intellixy. Aqui está o resumo do seu dia.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        <Card className="transition-all hover:shadow-md border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Provas</CardTitle>
            <div className="p-2 bg-rose-50 rounded-full">
              <FileText className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.exams}</div>
            <p className="text-xs text-slate-500 mt-1">Agendadas</p>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <div className="p-2 bg-amber-50 rounded-full">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.tasks}</div>
            <p className="text-xs text-slate-500 mt-1">Agendadas</p>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <div className="p-2 bg-blue-50 rounded-full">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.meetings}</div>
            <p className="text-xs text-slate-500 mt-1">Reuniões agendadas</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Próximos Compromissos</CardTitle>
            <CardDescription>Sua agenda para os próximos dias.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map((event, index) => {
                const eventDate = parseISO(`${event.date}T${event.time}`);
                const formattedDate = format(eventDate, "dd/MM 'às' HH:mm", { locale: ptBR });
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                    key={event.id} 
                    className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${
                      event.type === 'exam' ? 'bg-rose-100 text-rose-600' : 
                      event.type === 'task' ? 'bg-amber-100 text-amber-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {event.type === 'exam' ? <FileText className="h-4 w-4" /> : 
                       event.type === 'task' ? <Clock className="h-4 w-4" /> : 
                       <CalendarIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">{event.title}</h4>
                      <p className="text-xs text-slate-500">{event.subject} • {formattedDate}</p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Nenhum compromisso agendado.
                </div>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors" onClick={() => navigate('/schedule')}>
              Ver agenda completa <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {user?.role === 'teacher' && (
          <Card className="col-span-1 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white border-none shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-32 h-32" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-white">Ações Rápidas</CardTitle>
              <CardDescription className="text-indigo-100">Ferramentas para facilitar seu dia a dia.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-5 relative z-10">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/10"
              >
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </motion.div>
              <div className="text-center px-4">
                <h3 className="text-lg font-semibold text-white">Gerador de Provas com IA</h3>
                <p className="text-sm text-indigo-100 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Crie avaliações completas em segundos usando nossa inteligência artificial.
                </p>
              </div>
              <Button 
                variant="outline"
                className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white hover:text-indigo-700 w-full max-w-[220px] shadow-lg backdrop-blur-md"
                onClick={() => navigate('/create-exam')}
              >
                Criar Prova Agora
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
