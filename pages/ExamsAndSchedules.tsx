import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar as CalendarIcon, User, Search, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';
import { fixExamContent } from '@/lib/gemini';

interface Prova {
  id: string;
  materia: string;
  tema: string;
  data: string;
  userId?: string;
  status?: string;
}

interface DBEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  subject: string;
  type: string;
  createdBy?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function ExamsAndSchedules() {
  const { user } = useAuth();
  const [provas, setProvas] = useState<Prova[]>([]);
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserData>>({});
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, provas, events
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isFixingAI, setIsFixingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    let provasUnsub: () => void = () => {};
    let eventsUnsub: () => void = () => {};

    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Obter mapa de usuários se for admin
        let uMap: Record<string, UserData> = {};
        if (user.isAdmin) {
          const uSnap = await getDocs(collection(db, 'users'));
          uSnap.forEach(doc => {
            uMap[doc.id] = { id: doc.id, ...doc.data() } as UserData;
          });
          setUsersMap(uMap);
        }

        // Buscar Provas (se admin: todas. Se professor: só as dele)
        let provasQ = collection(db, 'provas') as any;
        if (!user.isAdmin) {
          provasQ = query(collection(db, 'provas'), where('userId', '==', user.id));
        }

        provasUnsub = onSnapshot(provasQ, (snapshot: any) => {
          const pData: Prova[] = [];
          snapshot.forEach((doc: any) => {
            pData.push({ id: doc.id, ...doc.data() } as Prova);
          });
          setProvas(pData.sort((a, b) => {
            const timeA = new Date(a.data).getTime();
            const timeB = new Date(b.data).getTime();
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
          }));
        }, (err) => {
          console.error("Provas fetch error:", err);
        });

        // Buscar Eventos (se admin: todos. Se professor: só os dele)
        let eventsQ = query(collection(db, 'events'), orderBy('date', 'desc'));
        if (!user.isAdmin) {
          eventsQ = query(collection(db, 'events'), where('createdBy', '==', user.id), orderBy('date', 'desc'));
        }

        eventsUnsub = onSnapshot(eventsQ, (snapshot: any) => {
          const eData: DBEvent[] = [];
          snapshot.forEach((doc: any) => {
            eData.push({ id: doc.id, ...doc.data() } as DBEvent);
          });
          setEvents(eData);
          setLoading(false);
        }, (err) => {
           console.error("events auth error", err);
           // Fallback if missing indexes for events depending on createdBy + orderBy
           if (err.message.includes('index')) {
              // try without orderBy
              let fallbackQ = collection(db, 'events') as any;
              if (!user.isAdmin) {
                 fallbackQ = query(collection(db, 'events'), where('createdBy', '==', user.id));
              }
              getDocs(fallbackQ).then(snap => {
                 const eData: DBEvent[] = [];
                 snap.forEach(doc => eData.push({ id: doc.id, ...(doc.data() as any) } as DBEvent));
                 setEvents(eData.sort((a, b) => {
                   const timeA = new Date(a.date).getTime();
                   const timeB = new Date(b.date).getTime();
                   return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
                 }));
                 setLoading(false);
              }).catch(e => {
                 console.error("events fallback error", e);
                 setLoading(false);
              });
           } else {
             setLoading(false);
           }
        });

      } catch(e) {
        console.error(e);
        setLoading(false);
      }
    };

    fetchAllData();

    return () => {
      provasUnsub();
      eventsUnsub();
    };
  }, [user]);

  // Combine and filter data
  let combined: any[] = [];
  
  if (filterType === 'all' || filterType === 'provas') {
    provas.forEach(p => {
      // Procurar eventos relacionados (mesma matéria ou tema similar)
      const relatedEvents = events.filter(e => p.materia.toLowerCase().includes(e.subject?.toLowerCase() || '') || e.title.toLowerCase().includes(p.materia.toLowerCase()));
      
      combined.push({
        _id: `p_${p.id}`,
        _type: 'prova',
        title: `${p.materia} - ${p.tema}`,
        date: p.data, // ISO string
        status: p.status || 'concluida',
        creatorId: p.userId,
        relatedEvents,
        original: p
      });
    });
  }

  if (filterType === 'all' || filterType === 'events') {
    events.forEach(e => {
      combined.push({
        _id: `e_${e.id}`,
        _type: 'event',
        title: e.title,
        date: `${e.date}T${e.time || '00:00'}`,
        subject: e.subject,
        eventType: e.type,
        creatorId: e.createdBy,
        original: e
      });
    });
  }

  // Filtrar pela busca
  const filtered = combined.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    
    // Buscar no título
    if (item.title.toLowerCase().includes(searchLower)) return true;
    
    // Buscar no professor (só se for admin)
    if (user?.isAdmin && item.creatorId) {
      const creatorName = usersMap[item.creatorId]?.name?.toLowerCase() || '';
      if (creatorName.includes(searchLower)) return true;
    }

    return false;
  }).sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  const handleItemClick = (item: any) => {
    if (!user?.isAdmin) return;
    setSelectedItem(item);
    setShowPrivacyWarning(true);
  };

  const acceptPrivacy = () => {
    setShowPrivacyWarning(false);
    if (selectedItem?._type === 'prova') {
      setEditContent(selectedItem.original.conteudo || '');
    } else if (selectedItem?._type === 'event') {
      setEditContent(selectedItem.original.title || ''); // Just an example, events mostly don't have long text 
    }
    setShowEditDialog(true);
  };

  const saveChanges = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      if (selectedItem._type === 'prova') {
        const id = selectedItem.original.id;
        await updateDoc(doc(db, 'provas', id), {
          conteudo: editContent
        });
      } else if (selectedItem._type === 'event') {
        const id = selectedItem.original.id;
        await updateDoc(doc(db, 'events', id), {
          title: editContent
        });
      }
      toast.success('Alterações salvas com sucesso');
      setShowEditDialog(false);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const redoWithAI = async () => {
    if (!selectedItem || selectedItem._type !== 'prova') return;
    setIsFixingAI(true);
    toast.info('Refazendo conteúdo com IA, aguarde...');
    try {
      const fixedContent = await fixExamContent(editContent);
      setEditContent(fixedContent);
      toast.success('Conteúdo refabricado! Analise as mudanças antes de salvar.');
    } catch (err: any) {
      toast.error('Erro ao refazer com IA: ' + err.message);
    } finally {
      setIsFixingAI(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'gerando': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'erro': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Provas & Cronogramas</h1>
          <p className="text-muted-foreground mt-1">
             {user?.isAdmin ? 'Visão global de todas as provas e cronogramas do sistema.' : 'Gerencie suas provas e eventos agendados.'}
          </p>
        </div>
      </motion.div>

      {/* Controles de Filtros */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={user?.isAdmin ? "Buscar por nome ou professor..." : "Buscar por nome..."} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os registros</SelectItem>
              <SelectItem value="provas">Apenas Provas</SelectItem>
              <SelectItem value="events">Apenas Eventos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Lista */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border bg-muted/10">
            <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground text-sm mt-1">Tente ajustar seus termos de busca ou filtros.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((item, idx) => {
              const itemDate = new Date(item.date);
              const formattedDate = isNaN(itemDate.getTime()) ? '' : format(itemDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
              const creatorName = item.creatorId ? usersMap[item.creatorId]?.name || 'Usuário Desconhecido' : '—';

              return (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                  onClick={() => handleItemClick(item)}
                  className={`p-5 rounded-xl border border-border bg-card shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${user?.isAdmin ? 'cursor-pointer hover:shadow-md' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${item._type === 'prova' ? 'bg-[#7C3AED]/10 text-[#7C3AED]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
                      {item._type === 'prova' ? <FileText className="h-6 w-6" /> : <CalendarIcon className="h-6 w-6" />}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[17px] font-semibold text-foreground line-clamp-1">{item.title}</h3>
                        {item._type === 'prova' && (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        )}
                        {item._type === 'event' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-500 border-blue-500/20 capitalize">
                            {item.eventType}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                        {formattedDate && (
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>{formattedDate}</span>
                          </div>
                        )}
                        {user?.isAdmin && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>{creatorName}</span>
                          </div>
                        )}
                        {item._type === 'event' && item.subject && (
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            <span>{item.subject}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Integração visual se For Prova e tiver Evento ligado */}
                      {item._type === 'prova' && item.relatedEvents && item.relatedEvents.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground bg-muted/30 px-2 py-1 rounded-md border border-border/50">
                            Integração Cronograma: {item.relatedEvents.length} evento(s) relacionados
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/60">{item._type === 'prova' ? 'Documento da Prova' : 'Agendamento'}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
      {/* Privacy Warning Dialog */}
      <Dialog open={showPrivacyWarning} onOpenChange={setShowPrivacyWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-500 flex items-center gap-2">
              Aviso de Privacidade
            </DialogTitle>
            <DialogDescription className="pt-4 text-base text-foreground">
              Você está acessando conteúdos de usuários. Use apenas para correções necessárias. Respeite a privacidade.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowPrivacyWarning(false)}>Cancelar</Button>
            <Button variant="default" onClick={acceptPrivacy}>Entendi e continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Conteúdo - {selectedItem?.title}</DialogTitle>
            <DialogDescription>
              Ajuste o formato, textos ou ortografia.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col py-4 mt-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 min-h-[300px] resize-none font-mono text-sm"
              placeholder="Conteúdo..."
            />
          </div>

          <DialogFooter className="flex items-center justify-between mt-auto pt-4 gap-2 border-t">
            {selectedItem?._type === 'prova' ? (
              <Button 
                variant="outline" 
                onClick={redoWithAI} 
                disabled={isFixingAI || isSaving}
                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 mr-auto"
              >
                {isFixingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Refazer com IA
              </Button>
            ) : <div />}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isFixingAI || isSaving}>
                Cancelar
              </Button>
              <Button onClick={saveChanges} disabled={isFixingAI || isSaving || !editContent.trim()}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar alterações
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
