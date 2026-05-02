import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, Clock, FileText, Users, Trash2 } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

type EventType = 'exam' | 'task' | 'meeting' | 'holiday' | 'other';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  subject: string;
  type: EventType;
  description: string;
  createdBy?: string;
  createdByRole?: string;
  visibleTo?: 'all' | 'onlyCreator';
}

export default function Schedule() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({ type: 'task' });

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let eventsData: Event[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Event;
        // Teachers see their own events and public events
        // Students see their own events and teacher's public events
        const isOwner = data.createdBy === user?.id;
        const isPublic = data.visibleTo === 'all';
        // Keep events if they are created by the current user, or if they are public.
        // Also keep legacy events without createdBy for safety.
        if (isOwner || isPublic || !data.createdBy) {
          eventsData.push({ id: doc.id, ...data });
        }
      });
      
      // Sort by time in memory to avoid requiring a composite index
      eventsData.sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return 0;
      });
      
      setEvents(eventsData);
    }, (error) => {
      console.error("Error fetching events:", error);
      toast.error("Erro ao carregar eventos.");
    });
    return () => unsubscribe();
  }, []);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.subject) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const isTeacher = user?.role === 'teacher';
      const isPublicEvent = isTeacher && (newEvent.type === 'exam' || newEvent.type === 'task');

      await addDoc(collection(db, 'events'), {
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        subject: newEvent.subject,
        type: newEvent.type,
        description: newEvent.description || '',
        createdBy: user?.id,
        createdByRole: user?.role,
        visibleTo: isPublicEvent ? 'all' : 'onlyCreator'
      });
      setIsOpen(false);
      setNewEvent({ type: 'task' });
      toast.success('Evento criado com sucesso!');
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Erro ao criar evento.");
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    if (event.createdBy && event.createdBy !== user?.id) {
      toast.error('Você não tem permissão para remover este evento.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'events', event.id));
      toast.success('Evento removido.');
    } catch (error) {
      console.error("Error deleting event: ", error);
      toast.error("Erro ao remover evento.");
    }
  };

  const getTypeIcon = (type: EventType) => {
    switch (type) {
      case 'exam': return <FileText className="h-5 w-5 text-rose-600" />;
      case 'task': return <Clock className="h-5 w-5 text-amber-600" />;
      case 'meeting': return <Users className="h-5 w-5 text-blue-600" />;
      case 'holiday': return <CalendarIcon className="h-5 w-5 text-green-600" />;
      case 'other': return <CalendarIcon className="h-5 w-5 text-slate-600" />;
    }
  };

  const getTypeBg = (type: EventType) => {
    switch (type) {
      case 'exam': return 'bg-rose-50';
      case 'task': return 'bg-amber-50';
      case 'meeting': return 'bg-blue-50';
      case 'holiday': return 'bg-green-50';
      case 'other': return 'bg-slate-50';
    }
  };

  const getTypeName = (type: EventType) => {
    switch (type) {
      case 'exam': return 'Prova';
      case 'task': return 'Tarefa';
      case 'meeting': return 'Reunião';
      case 'holiday': return 'Feriado';
      case 'other': return 'Outro';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cronograma</h1>
          <p className="text-slate-500 mt-1">Gerencie suas provas, tarefas e reuniões.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-2 h-5 w-5" /> Novo Evento
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
                <DialogDescription>Adicione um novo compromisso ao seu cronograma.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" value={newEvent.title || ''} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Ex: Prova Bimestral" className="transition-all focus-visible:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input id="date" type="date" value={newEvent.date || ''} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="transition-all focus-visible:ring-blue-500" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Hora *</Label>
                    <Input id="time" type="time" value={newEvent.time || ''} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="transition-all focus-visible:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select value={newEvent.type} onValueChange={(v: EventType) => setNewEvent({...newEvent, type: v})}>
                      <SelectTrigger id="type" className="transition-all focus-visible:ring-blue-500">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exam">Prova</SelectItem>
                        <SelectItem value="task">Tarefa</SelectItem>
                        <SelectItem value="meeting">Reunião</SelectItem>
                        <SelectItem value="holiday">Feriado</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Matéria *</Label>
                    <Input id="subject" value={newEvent.subject || ''} onChange={e => setNewEvent({...newEvent, subject: e.target.value})} placeholder="Ex: Matemática" className="transition-all focus-visible:ring-blue-500" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" value={newEvent.description || ''} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="Detalhes adicionais..." className="transition-all focus-visible:ring-blue-500" />
                </div>
              </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateEvent}>Salvar Evento</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4"
      >
        <AnimatePresence mode="popLayout">
          {events.map((event) => {
            const eventDate = parseISO(`${event.date}T${event.time}`);
            const formattedDate = format(eventDate, "dd 'de' MMMM, yyyy", { locale: ptBR });
            const isTeacherPublicEvent = event.createdByRole === 'teacher' && event.visibleTo === 'all' && event.createdBy !== user?.id;
            
            return (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`overflow-hidden relative group shadow-sm hover:shadow-md transition-all ${isTeacherPublicEvent ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}>
                  {isTeacherPublicEvent && (
                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-bl-lg border-b border-l border-blue-200 z-10">
                      📌 Professor
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row">
                    <div className={`sm:w-48 p-6 flex flex-col justify-center items-center border-b sm:border-b-0 sm:border-r ${isTeacherPublicEvent ? 'border-blue-100' : 'border-slate-100'} ${getTypeBg(event.type)}`}>
                      <div className="text-center">
                        <span className="block text-sm font-medium text-slate-600 mb-1">{getTypeName(event.type)}</span>
                        <span className="block text-2xl font-bold text-slate-900">{event.time}</span>
                        <span className="block text-xs text-slate-500 mt-1">{format(eventDate, "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                          <p className="text-sm font-medium text-blue-600">{event.subject}</p>
                        </div>
                        <div className={`p-2 rounded-full ${getTypeBg(event.type)}`}>
                          {getTypeIcon(event.type)}
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-slate-600 text-sm mt-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                  {(!event.createdBy || event.createdBy === user?.id) && (
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteEvent(event)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {events.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200 border-dashed"
          >
            <CalendarIcon className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">Nenhum evento</h3>
            <p className="mt-1 text-sm text-slate-500">Você não tem eventos agendados.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
