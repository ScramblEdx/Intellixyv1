import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createRoot } from 'react-dom/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Trash2, Calendar, BookOpen, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ExamLayout } from '@/components/ExamLayout';

interface Prova {
  id: string;
  materia: string;
  tema: string;
  conteudo: string;
  data: string;
  dificuldade: number;
  pdfUrl?: string;
  status?: 'gerando' | 'concluida' | 'erro';
  nivelEnsino?: 'fundamental' | 'medio';
}

export default function Archives() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Prova[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('all');
  const [selectedExam, setSelectedExam] = useState<Prova | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'provas'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const examsData: Prova[] = [];
      snapshot.forEach((doc) => {
        examsData.push({ id: doc.id, ...doc.data() } as Prova);
      });
      
      // Ordenar na memória (client-side) para evitar a necessidade de índice composto no Firestore
      examsData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      setExams(examsData);
    }, (error) => {
      console.error("Error fetching exams:", error);
      toast.error("Erro ao carregar arquivos.");
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'provas', id));
      toast.success('Prova excluída com sucesso.');
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error('Erro ao excluir a prova.');
    }
  };

  const downloadPDF = async (exam: Prova) => {
    if (!exam || !exam.conteudo) {
      toast.error('A prova ainda não foi carregada.');
      return;
    }

    if (exam.pdfUrl) {
      setIsDownloading(exam.id);
      toast.info('Baixando PDF...');
      try {
        const response = await fetch(exam.pdfUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prova-${exam.materia.toLowerCase()}-${exam.tema.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Download concluído!');
      } catch (error) {
        console.error('Erro ao baixar PDF do Storage:', error);
        window.open(exam.pdfUrl, '_blank');
      } finally {
        setIsDownloading(null);
      }
      return;
    }

    setIsDownloading(exam.id);
    toast.info('Gerando PDF, aguarde...');

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      // Create a temporary element to hold the markdown
      const tempDiv = document.createElement('div');
      tempDiv.id = 'temp-pdf-container';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm'; // Fixed width for A4
      document.body.appendChild(tempDiv);

      const root = createRoot(tempDiv);
      root.render(
        <div style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
          <ExamLayout 
            subject={exam.materia} 
            level={exam.nivelEnsino === 'medio' ? 'Ensino Médio' : 'Ensino Fundamental'}
            content={exam.conteudo} 
            isPdf={true}
          />
        </div>
      );

      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 800));

      let katexCss = '';
      try {
        const katexRes = await fetch('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css');
        katexCss = await katexRes.text();
      } catch (e) {
        console.warn('Failed to fetch katex css', e);
      }

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc: Document) => {
          // CRITICAL FIX: Remove all original stylesheets in the cloned document
          // This prevents html2canvas from parsing Tailwind's oklch() colors and crashing
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());

          // Inject safe CSS for the PDF
          const safeStyle = clonedDoc.createElement('style');
          safeStyle.innerHTML = katexCss + `
            body { background: #ffffff !important; color: #000000 !important; }
            #temp-pdf-container { padding: 0; font-family: Arial, sans-serif; line-height: 1.5; width: 210mm; }
            h1 { font-size: 24px; font-weight: bold; margin-bottom: 16px; }
            h2 { font-size: 20px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; }
            h3 { font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
            p { margin-bottom: 12px; }
            ul { margin-bottom: 12px; padding-left: 24px; list-style-type: disc; }
            ol { margin-bottom: 12px; padding-left: 24px; list-style-type: decimal; }
            li { margin-bottom: 6px; }
            strong { font-weight: bold; }
            * { word-wrap: break-word; overflow-wrap: break-word; }
          `;
          clonedDoc.head.appendChild(safeStyle);
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Handling pagination if content is too long for one page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      // Generate blob for upload
      const pdfBlob = pdf.output('blob');
      
      // Upload to Firebase Storage
      try {
        const storageRef = ref(storage, `provas/${user?.id}/${exam.id}.pdf`);
        await uploadBytes(storageRef, pdfBlob);
        const pdfUrl = await getDownloadURL(storageRef);
        
        // Update Firestore with the URL
        await updateDoc(doc(db, 'provas', exam.id), { pdfUrl });
      } catch (uploadError) {
        console.error('Erro ao fazer upload do PDF:', uploadError);
        // Continue even if upload fails, so the user still gets the download
      }

      // Trigger download for the user
      pdf.save(`prova-${exam.materia.toLowerCase()}-${exam.tema.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success('PDF baixado com sucesso!');

      // Cleanup
      root.unmount();
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o arquivo PDF.');
    } finally {
      setIsDownloading(null);
    }
  };

  const uniqueMaterias = Array.from(new Set(exams.map(e => e.materia))).sort();

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.materia.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exam.tema.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedMateria === 'all' || exam.materia === selectedMateria;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Arquivos</h1>
        <p className="text-slate-500 mt-1">Gerencie todas as provas geradas anteriormente.</p>
      </motion.div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 bg-white sticky top-0 z-10 rounded-t-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Buscar por matéria ou tema..."
                className="pl-10 w-full h-10 bg-slate-50 border-slate-200 transition-all focus:ring-0 focus-visible:ring-0 focus:border-indigo-400 focus:bg-white rounded-lg shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={selectedMateria} onValueChange={setSelectedMateria}>
                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg">
                  <SelectValue placeholder="Filtrar por matéria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as matérias</SelectItem>
                  {uniqueMaterias.map((materia) => (
                    <SelectItem key={materia} value={materia}>
                      {materia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-4 sm:px-6">
          {filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {filteredExams.map((exam) => (
                  <motion.div
                    key={exam.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 border-slate-200 rounded-xl overflow-hidden hover:-translate-y-1 bg-white">
                      <CardHeader className="pb-2 pt-5 px-5">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-[17px] font-bold text-slate-800 line-clamp-1">{exam.materia}</CardTitle>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                            exam.dificuldade === 33 ? "bg-emerald-100 text-emerald-700" :
                            exam.dificuldade === 66 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {exam.dificuldade === 33 ? 'Fácil' : exam.dificuldade === 66 ? 'Médio' : 'Difícil'}
                          </span>
                        </div>
                        <CardDescription className="line-clamp-2 mt-1.5 text-slate-500 font-medium text-sm leading-relaxed">
                          {exam.tema}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 pb-3 px-5">
                        <div className="flex items-center text-[11px] font-medium text-slate-400 mt-2 bg-slate-50 rounded-md w-fit px-2 py-1 border border-slate-100">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          {format(new Date(exam.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-3 pb-4 px-5 border-t border-slate-100/60 bg-slate-50/30 flex justify-between gap-2.5">
                        {exam.status === 'gerando' ? (
                          <div className="w-full flex items-center justify-center p-1 text-sm text-indigo-600 font-medium bg-indigo-50/50 rounded-lg h-9">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                          </div>
                        ) : exam.status === 'erro' ? (
                          <>
                            <div className="flex-1 flex items-center justify-center p-1 text-xs text-rose-600 font-medium bg-rose-50 rounded-lg h-9">
                              Falha na geração
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-9 w-9 rounded-lg"
                              onClick={() => handleDelete(exam.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="flex-1 shadow-none bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold h-9 rounded-lg"
                              onClick={() => {
                                setSelectedExam(exam);
                                setIsViewModalOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1.5" />
                              Ver
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 h-9 rounded-lg"
                              onClick={() => downloadPDF(exam)}
                              disabled={isDownloading === exam.id}
                            >
                              {isDownloading === exam.id ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-1.5" />
                              )}
                              PDF
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-9 w-9 rounded-lg"
                              onClick={() => handleDelete(exam.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                <BookOpen className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-center max-w-sm">Nenhuma prova encontrada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border bg-card flex-shrink-0">
            <DialogTitle className="flex justify-between items-center pr-6">
              <span>{selectedExam?.materia} - {selectedExam?.tema}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => selectedExam && downloadPDF(selectedExam)}
                className="ml-4"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 bg-muted/20 flex justify-center">
            <div id="prova-view" className="w-full shadow-md border border-border rounded-sm overflow-hidden">
              <ExamLayout 
                subject={selectedExam?.materia || ''} 
                level={selectedExam?.nivelEnsino === 'medio' ? 'Ensino Médio' : 'Ensino Fundamental'}
                content={selectedExam?.conteudo || ''} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
