import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Search, Filter, ShieldAlert, Crown, Star, Zap, User as UserIcon, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserData {
  id: string;
  email: string;
  name?: string;
  role: 'student' | 'teacher';
  plan?: 'free' | 'pago' | 'deluxe';
  provasGeradasMes?: number;
  provasGeradasDia?: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pago' | 'deluxe'>('all');
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [warningTimer, setWarningTimer] = useState(3);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList: UserData[] = [];
        querySnapshot.forEach((docSnap) => {
          usersList.push({ id: docSnap.id, ...docSnap.data() } as UserData);
        });
        setUsers(usersList);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        toast.error('Erro ao carregar usuários.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  useEffect(() => {
    if (warningTimer > 0) {
      const timer = setTimeout(() => setWarningTimer(warningTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [warningTimer]);

  const handleUpdatePlan = async (userId: string, newPlan: 'free' | 'pago' | 'deluxe') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { plan: newPlan });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, plan: newPlan } : u
      ));
      toast.success('Plano atualizado com sucesso!');
      setEditingUserId(null);
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      toast.error('Erro ao atualizar plano.');
    }
  };

  if (!user?.isAdmin) return null;

  if (!warningAccepted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-zinc-900 border border-amber-500/30 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Aviso de Segurança</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Você está acessando e modificando dados de usuários. Use com responsabilidade.
          </p>
          <button
            onClick={() => setWarningAccepted(true)}
            disabled={warningTimer > 0}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
              warningTimer > 0 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
            }`}
          >
            {warningTimer > 0 ? `Aguarde ${warningTimer}s...` : 'Estou ciente e assumo a responsabilidade'}
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesPlan = filterPlan === 'all' || (u.plan || 'free') === filterPlan;
    return matchesSearch && matchesRole && matchesPlan;
  });

  const students = filteredUsers.filter(u => u.role === 'student');
  const teachers = filteredUsers.filter(u => u.role === 'teacher');

  const PlanBadge = ({ plan }: { plan?: string }) => {
    const p = plan || 'free';
    if (p === 'deluxe') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Crown size={12} /> Deluxe</span>;
    if (p === 'pago') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Zap size={12} /> Profissional</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700"><Star size={12} /> Básico</span>;
  };

  const UserTable = ({ data, title, icon: Icon }: { data: UserData[], title: string, icon: any }) => (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">{title} <span className="text-sm font-normal text-zinc-500 ml-2">({data.length})</span></h2>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
          <p className="text-zinc-500">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Usuário</th>
                <th className="px-6 py-4 font-medium">Plano Atual</th>
                <th className="px-6 py-4 font-medium">Provas (Mês)</th>
                <th className="px-6 py-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {data.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-200">{u.name || 'Sem nome'}</span>
                      <span className="text-zinc-500 text-xs mt-0.5">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <PlanBadge plan={u.plan} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-300 font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                      {u.provasGeradasMes || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingUserId === u.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <select 
                          className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2"
                          value={u.plan || 'free'}
                          onChange={(e) => handleUpdatePlan(u.id, e.target.value as any)}
                        >
                          <option value="free">Básico (Grátis)</option>
                          <option value="pago">Profissional (Pago)</option>
                          <option value="deluxe">Deluxe</option>
                        </select>
                        <button 
                          onClick={() => setEditingUserId(null)}
                          className="p-2 text-zinc-400 hover:text-white transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingUserId(u.id)}
                        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                      >
                        Alterar Plano
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldAlert size={14} /> Administrador
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Painel de Controle
        </h1>
        <p className="text-zinc-400 max-w-2xl">
          Gerencie usuários, visualize métricas e controle de acesso a planos premium.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-xl focus:ring-purple-500 focus:border-purple-500 block px-4 py-2.5 outline-none hover:bg-zinc-800 transition-colors"
          >
            <option value="all">Todos Tipos</option>
            <option value="teacher">Professores</option>
            <option value="student">Alunos</option>
          </select>
          
          <select 
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-xl focus:ring-purple-500 focus:border-purple-500 block px-4 py-2.5 outline-none hover:bg-zinc-800 transition-colors"
          >
            <option value="all">Todos Planos</option>
            <option value="free">Básico</option>
            <option value="pago">Profissional</option>
            <option value="deluxe">Deluxe</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {(filterRole === 'all' || filterRole === 'teacher') && (
            <UserTable data={teachers} title="Professores" icon={BookOpen} />
          )}
          
          {(filterRole === 'all' || filterRole === 'student') && (
            <UserTable data={students} title="Alunos" icon={UserIcon} />
          )}
        </div>
      )}
    </div>
  );
}
