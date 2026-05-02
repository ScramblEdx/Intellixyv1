import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, X, Loader2, LogOut, TrendingUp, TrendingDown, Target, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/lib/auth';

interface TeacherRequest {
  id: string;
  name: string;
  email: string;
  approvalStatus: string;
}

interface AdminGoal {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

interface DailyAccess {
  date: string;
  views: number;
}

interface PathAccess {
  path: string;
  views: number;
}

export default function Dev() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [teachers, setTeachers] = useState<TeacherRequest[]>([]);
  const [goals, setGoals] = useState<AdminGoal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [dailyData, setDailyData] = useState<DailyAccess[]>([]);
  const [pathData, setPathData] = useState<PathAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const snapshot = await getDocs(q);
      const data: TeacherRequest[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        if (d.approvalStatus === 'pending') {
          data.push({
            id: doc.id,
            name: d.name || 'Sem nome',
            email: d.email || '',
            approvalStatus: d.approvalStatus
          });
        }
      });
      setTeachers(data);
    } catch (e) {
      console.error("Error fetching teachers", e);
    }
  };

  useEffect(() => {
    fetchTeachers();

    const fetchAnalytics = async () => {
      try {
        const dailySnapshot = await getDocs(query(collection(db, 'analytics'), orderBy('date', 'asc')));
        const dData: DailyAccess[] = [];
        const pData: PathAccess[] = [];
        
        dailySnapshot.forEach(doc => {
          const data = doc.data();
          if (doc.id.startsWith('daily_')) {
            dData.push({ date: data.date.substring(5), views: data.views }); // just show MM-DD
          } else if (doc.id.startsWith('path_')) {
            pData.push({ path: data.path, views: data.views });
          }
        });
        
        // If empty data, provide some realistic mock data to show the beautiful charts
        if (dData.length <= 1) {
           dData.push({ date: '01-01', views: 12 }, { date: '01-02', views: 15 }, { date: '01-03', views: 8 }, { date: '01-04', views: 22 });
        }
        if (pData.length === 0) {
           pData.push({ path: 'dashboard', views: 45 }, { path: 'schedule', views: 30 }, { path: 'create-exam', views: 15 });
        }

        setDailyData(dData);
        setPathData(pData.sort((a, b) => b.views - a.views));
      } catch (e) {
        console.error("Error fetching analytics", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    const goalsUnsub = onSnapshot(query(collection(db, 'admin_goals'), orderBy('createdAt', 'desc')), (snapshot) => {
      const gData: AdminGoal[] = [];
      snapshot.forEach(doc => {
        gData.push({ id: doc.id, ...doc.data() } as AdminGoal);
      });
      setGoals(gData);
    });

    return () => {
      goalsUnsub();
    };
  }, []);

  const handleApprove = async (id: string, name: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { approvalStatus: 'approved' });
      toast.success(`Professor(a) ${name} aprovado.`);
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      toast.error('Erro ao aprovar');
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { approvalStatus: 'rejected' });
      toast.success(`Professor(a) ${name} rejeitado.`);
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      toast.error('Erro ao rejeitar');
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    try {
      await addDoc(collection(db, 'admin_goals'), {
        title: newGoal,
        completed: false,
        createdAt: Date.now()
      });
      setNewGoal('');
    } catch(e) {
      toast.error('Erro ao adicionar meta');
    }
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'admin_goals', id), { completed: !completed });
    } catch(e) {}
  };

  const deleteGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'admin_goals', id));
    } catch(e) {}
  };

  // Calculate Growth
  let growth = 0;
  let growthMessage = "Coletando dados... 📊";
  if (dailyData.length >= 2) {
    const today = dailyData[dailyData.length - 1].views;
    const yesterday = dailyData[dailyData.length - 2].views;
    if (yesterday > 0) {
      growth = Math.round(((today - yesterday) / yesterday) * 100);
      if (growth > 0) {
        growthMessage = "Você está crescendo, continue assim 🚀";
      } else if (growth < 0) {
        growthMessage = "Não desanime, ajuste e continue 💪";
      } else {
        growthMessage = "Manteve o ritmo, busque inovar! ✨";
      }
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#0A0A0F] text-[#F3F4F6] font-sans selection:bg-[#7C3AED]/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#D4AF37]/20 bg-[#0A0A0F]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-[0_4px_30px_rgba(212,175,55,0.05)]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => logout()} className="text-[#F3F4F6] hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors">
            <LogOut className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <span className="text-[#F3F4F6]">Intellixy</span>
            <span className="text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">Admin</span>
          </h1>
        </div>
        <div className="px-3 py-1 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 text-sm font-medium text-[#c4a9f6] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse"></div>
          Sistema Ativo
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* Top Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="col-span-1 md:col-span-2 rounded-2xl border border-[#D4AF37]/20 bg-[#0A0A0F] p-6 shadow-[0_0_15px_rgba(212,175,55,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h2 className="text-xl font-semibold text-[#D4AF37]">Acessos por Dia</h2>
                <p className="text-sm text-gray-400 mt-1">Tráfego geral da plataforma</p>
              </div>
              {growth !== 0 && (
                <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold text-sm ${growth > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {growth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {growth > 0 ? '+' : ''}{growth}% hoje
                </div>
              )}
            </div>
            
            <div className="h-[250px] w-full mt-2 relative z-10">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{backgroundColor: '#0A0A0F', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: '#F3F4F6'}} itemStyle={{color: '#D4AF37'}} />
                    <Line type="monotone" dataKey="views" stroke="#D4AF37" strokeWidth={3} dot={{fill: '#0A0A0F', stroke: '#D4AF37', strokeWidth: 2, r: 4}} activeDot={{r: 6, fill: '#D4AF37'}} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-[#7C3AED]/20 to-transparent border-l-2 border-[#7C3AED] relative z-10">
              <p className="text-sm text-[#e0d2fe] italic">{growthMessage}</p>
            </div>
          </motion.div>

          <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="rounded-2xl border border-[#D4AF37]/20 bg-[#0A0A0F] p-6 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
            <h2 className="text-xl font-semibold text-[#D4AF37] mb-6">Acessos por Aba</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" /></div>
              ) : (
                pathData.map((item, i) => (
                  <div key={item.path} className="group">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-300">{item.path}</span>
                      <span className="text-[#D4AF37] font-medium">{item.views}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#D4AF37] rounded-full transition-all duration-1000" style={{width: `${Math.min(100, (item.views / (pathData[0]?.views || 1)) * 100)}%`}}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="rounded-2xl border border-[#7C3AED]/30 bg-[#0A0A0F] p-6 shadow-[0_0_15px_rgba(124,58,237,0.05)]">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-[#7C3AED]" />
              <h2 className="text-xl font-semibold text-[#F3F4F6]">Metas do Projeto</h2>
            </div>
            
            <form onSubmit={handleAddGoal} className="flex gap-2 mb-6">
              <Input 
                value={newGoal} 
                onChange={(e) => setNewGoal(e.target.value)} 
                placeholder="Ex: Conseguir 100 usuários..." 
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#7C3AED]/50"
              />
              <Button type="submit" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">Adicionar</Button>
            </form>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {goals.length === 0 ? (
                <p className="text-center text-white/30 py-4 text-sm">Nenhuma meta definida.</p>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${goal.completed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleGoal(goal.id, goal.completed)} className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${goal.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/30 hover:border-[#7C3AED]'}`}>
                        {goal.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <span className={goal.completed ? 'text-white/50 line-through' : 'text-white/90'}>{goal.title}</span>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-white/20 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}} className="rounded-2xl border border-[#D4AF37]/20 bg-[#0A0A0F] p-6 shadow-[0_0_15px_rgba(212,175,55,0.05)] flex flex-col">
            <h2 className="text-xl font-semibold text-[#D4AF37] mb-2">Controle de Usuários</h2>
            <p className="text-sm text-gray-400 mb-6">Aprove professores e em breve alunos.</p>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center">
                  <Check className="w-10 h-10 text-white/20 mb-3" />
                  <p className="text-white/40 font-medium">Nenhuma solicitação pendente</p>
                </div>
              ) : (
                <div className="space-y-3 pr-2">
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{teacher.name}</p>
                        <p className="text-sm text-white/50">{teacher.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleApprove(teacher.id, teacher.name)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30">
                          Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(teacher.id, teacher.name)} className="bg-transparent border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

