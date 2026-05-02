import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateExam } from '@/lib/gemini';
import { Loader2, Sparkles, Copy, Check, BookOpen, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/lib/auth';
import { ExamLayout } from '@/components/ExamLayout';

export default function CreateExam() {
  const { user } = useAuth();
  const [educationLevel, setEducationLevel] = useState<'fundamental' | 'medio'>('fundamental');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2); // 1: Fácil, 2: Médio, 3: Difícil
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fundamentalSubjects = ['Ciências', 'Ensino Religioso', 'Inglês', 'Português', 'Matemática', 'História', 'Educação Física', 'Geografia'];
  const medioSubjects = [...fundamentalSubjects, 'Química', 'Biologia', 'Física'];

  const availableSubjects = educationLevel === 'fundamental' ? fundamentalSubjects : medioSubjects;

  const handleLevelChange = (level: 'fundamental' | 'medio') => {
    setEducationLevel(level);
    if (level === 'fundamental' && !fundamentalSubjects.includes(subject)) {
      setSubject('');
    }
  };

  useEffect(() => {
    if (!currentExamId) return;

    const unsubscribe = onSnapshot(doc(db, 'provas', currentExamId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'concluida') {
          setGeneratedExam(data.conteudo);
          setIsGenerating(false);
        } else if (data.status === 'erro') {
          setIsGenerating(false);
        } else if (data.status === 'gerando') {
          setIsGenerating(true);
        }
      }
    });

    return () => unsubscribe();
  }, [currentExamId]);

  const handleGenerate = async () => {
    if (!subject || !topic) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado para gerar provas.');
      return;
    }

    setGeneratedExam(''); // Limpa o conteúdo antigo
    setCurrentExamId(null);
    setIsGenerating(true);
    
    try {
      // Mapeia 1, 2, 3 para 33, 66, 100 para a API do Gemini
      const difficultyValue = difficulty === 1 ? 33 : difficulty === 2 ? 66 : 100;
      
      const docRef = await addDoc(collection(db, 'provas'), {
        userId: user.id,
        materia: subject,
        tema: topic,
        dificuldade: difficultyValue,
        nivelEnsino: educationLevel,
        conteudo: '',
        data: new Date().toISOString(),
        status: 'gerando'
      });
      
      setCurrentExamId(docRef.id);
      
      toast.success('Geração iniciada!', {
        description: 'Você já pode navegar pelo app. A prova aparecerá em Arquivos.',
        duration: 5000,
      });

      // Roda em segundo plano
      generateExam(subject, topic, difficultyValue, educationLevel)
        .then(async (result) => {
          if (user) {
            await updateDoc(docRef, {
              conteudo: result,
              status: 'concluida'
            });
            toast.success('Sua prova foi gerada com sucesso!', {
              description: `A prova de ${subject} já está nos Arquivos.`,
              duration: 6000,
            });
          }
        })
        .catch(async (error) => {
          console.error("Erro na geração da prova:", error);
          await updateDoc(docRef, { status: 'erro' });
          toast.error(`Falha ao gerar prova de ${subject}. Tente novamente.`);
        });

    } catch (error) {
      toast.error('Erro ao conectar com o banco de dados.');
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedExam);
    setCopied(true);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = async () => {
    setIsDownloading(true);
    toast.info('Gerando PDF, aguarde...');

    try {
      // @ts-ignore
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      // Create a temporary element to hold the markdown
      const tempDiv = document.createElement('div');
      tempDiv.id = 'temp-pdf-container';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);

      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempDiv);
      root.render(
        <div style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
          <ExamLayout 
            subject={subject} 
            level={educationLevel === 'medio' ? 'Ensino Médio' : 'Ensino Fundamental'}
            content={generatedExam} 
          />
        </div>
      );

      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 800));

      const opt = {
        margin: 10,
        filename: `prova-${subject.toLowerCase()}-${topic.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
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
            safeStyle.innerHTML = `
              body { background: #ffffff !important; color: #000000 !important; }
              #temp-pdf-container { padding: 40px; font-family: Arial, sans-serif; line-height: 1.5; width: 800px; }
              h1 { font-size: 24px; font-weight: bold; margin-bottom: 16px; }
              h2 { font-size: 20px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; }
              h3 { font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
              p { margin-bottom: 12px; }
              ul { margin-bottom: 12px; padding-left: 24px; list-style-type: disc; }
              ol { margin-bottom: 12px; padding-left: 24px; list-style-type: decimal; }
              li { margin-bottom: 6px; }
              strong { font-weight: bold; }
            `;
            clonedDoc.head.appendChild(safeStyle);
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const worker = (html2pdf as any)().set(opt).from(tempDiv);

      if (currentExamId && user) {
        try {
          const pdfBlob = await worker.outputPdf('blob');
          const storageRef = ref(storage, `provas/${user.id}/${currentExamId}.pdf`);
          await uploadBytes(storageRef, pdfBlob);
          const pdfUrl = await getDownloadURL(storageRef);
          
          await updateDoc(doc(db, 'provas', currentExamId), { pdfUrl });
        } catch (uploadError) {
          console.error('Erro ao fazer upload do PDF:', uploadError);
        }
      }

      await worker.save();
      toast.success('PDF baixado com sucesso!');

      // Cleanup
      root.unmount();
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o arquivo PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const difficultyLabels = {
    1: { label: 'Fácil', color: 'text-emerald-600', bg: 'bg-emerald-500' },
    2: { label: 'Médio', color: 'text-amber-600', bg: 'bg-amber-500' },
    3: { label: 'Difícil', color: 'text-rose-600', bg: 'bg-rose-500' }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Criar Prova com IA</h1>
        <p className="text-slate-500 mt-1">Gere avaliações personalizadas usando a inteligência artificial do Gemini.</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.4, delay: 0.1 }}
          className="md:col-span-4 h-fit"
        >
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Defina os parâmetros para a geração.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Nível de Ensino</Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => handleLevelChange('fundamental')}
                    className={cn(
                      "py-2 px-3 text-sm font-medium rounded-md transition-all",
                      educationLevel === 'fundamental' 
                        ? "bg-white text-indigo-700 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Ensino Fundamental
                  </button>
                  <button
                    onClick={() => handleLevelChange('medio')}
                    className={cn(
                      "py-2 px-3 text-sm font-medium rounded-md transition-all",
                      educationLevel === 'medio' 
                        ? "bg-white text-indigo-700 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Ensino Médio
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Matéria</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="subject" className="transition-all focus:ring-2 focus:ring-indigo-500">
                    <SelectValue placeholder="Selecione a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Tema / Assunto</Label>
                <Input 
                  id="topic" 
                  placeholder="Ex: Segunda Guerra Mundial..." 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <Label>Dificuldade</Label>
                  <motion.span 
                    key={difficulty}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn("text-sm font-semibold px-2 py-1 rounded-md bg-slate-100", difficultyLabels[difficulty].color)}
                  >
                    {difficultyLabels[difficulty].label}
                  </motion.span>
                </div>
                
                <div className="relative pt-2 pb-6">
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition-all hover:accent-indigo-700"
                  />
                  <div className="absolute w-full flex justify-between text-xs text-slate-400 mt-2 px-1 font-medium">
                    <span className={difficulty === 1 ? 'text-emerald-600' : ''}>Fácil</span>
                    <span className={difficulty === 2 ? 'text-amber-600' : ''}>Médio</span>
                    <span className={difficulty === 3 ? 'text-rose-600' : ''}>Difícil</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-[15px] shadow-indigo-600/20" 
                onClick={handleGenerate}
                disabled={isGenerating || !subject || !topic}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando Prova...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Gerar Prova
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.4, delay: 0.2 }}
          className="md:col-span-8 flex flex-col min-h-[500px]"
        >
          <Card className="flex flex-col h-full shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>Sua prova gerada aparecerá aqui.</CardDescription>
              </div>
              <AnimatePresence>
                {generatedExam && !isGenerating && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex-1 sm:flex-none">
                      {copied ? <Check className="h-4 w-4 mr-1.5 text-emerald-600" /> : <Copy className="h-4 w-4 mr-1.5" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </Button>
                    <Button variant="default" size="sm" onClick={downloadPDF} disabled={isDownloading} className="flex-1 sm:flex-none">
                      {isDownloading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                      Baixar PDF
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative bg-white">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-xl bg-indigo-500/20 animate-pulse" />
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-600 relative z-10" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-4 animate-pulse">A IA está elaborando as questões...</p>
                  </motion.div>
                ) : generatedExam ? (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-6 h-full overflow-y-auto max-w-none flex justify-center bg-muted/20"
                  >
                    <div id="prova" className="w-full max-w-[210mm] shadow-sm bg-white border border-border rounded-sm">
                      <ExamLayout 
                        subject={subject} 
                        level={educationLevel === 'medio' ? 'Ensino Médio' : 'Ensino Fundamental'}
                        content={generatedExam} 
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-slate-400 p-6"
                  >
                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                      <BookOpen className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-center max-w-sm">Preencha as configurações ao lado e clique em "Gerar Prova" para começar.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
