import { GoogleGenAI } from "@google/genai";

// Tenta usar a chave da variável VITE_ (caso esteja testando localmente/preview)
// Mas na Vercel o endpoint /api/generate será chamado com segurança, usando process.env.GEMINI_API_KEY
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

export async function fixExamContent(content: string) {
  try {
    const response = await fetch('/api/fix-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (response.ok) {
      const data = await response.json();
      return data.text;
    }
  } catch (err) {
    console.log("Vercel API fallback for fix-exam", err);
  }

  if (!apiKey) {
    throw new Error('Fallback failed: GEMINI API KEY is missing on client side.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Analise a prova ou conteúdo educacional abaixo e faça correções de formatação, ortografia e consistência.
Mantenha a mesma quantidade de questões e alternativas. Apenas melhore a qualidade visual e corrija erros.
Certifique-se de usar o mesmo formato de prova (Questão seguida por alternativas A, B, C, D).

IMPORTANTE 1: Simplifique a linguagem (evite palavras excessivamente formais ou rebuscadas) e encurte os enunciados onde possível (buscando ter de 3 a 5 linhas), tornando a leitura mais rápida e objetiva, sem perder o nível técnico da questão.
IMPORTANTE 2: Remova todas as tags "<br><br><br>" que encontrar e use apenas "---" (uma linha horizontal) entre as questões para criar a separação. Nenhuma tag HTML deve ser deixada na prova.

CONTEÚDO ORIGINAL:
${content}

Escreva abaixo a versão corrigida:`;

  const aiResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  
  let text = aiResponse.text || "";
  text = text.replace(/(?:^|\\n)(?:\\*\\*|### )?(?:Respostas do aluno|Gabarito|Folha de respostas).*/is, "");
  return text;
}

export async function generateExam(subject: string, topic: string, difficulty: number, educationLevel: 'fundamental' | 'medio' = 'fundamental') {
  try {
    // 1. TENTA USAR A API SERVERLESS (VERCEL)
    // Se a rota existir, o frontend não usa a API Key, o backend cuidará disso com segurança
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, topic, difficultyValue: difficulty, educationLevel })
    });

    if (response.ok) {
      const data = await response.json();
      return data.text;
    }
  } catch (err) {
    console.log("Vercel API route not available or failed. Falling back to local/client execution.", err);
  }

  // 2. FALLBACK PARA PREVIEW LOCAL/CLIENTE
  // Caso o endpoint /api não seja encontrado (ex: dev local sem serverless helper), roda localmente
  // Lembre-se: em produção real o ideal é ter a key somente no backend e não enviá-la ao cliente.
  if (!apiKey) {
    throw new Error('Fallback failed: GEMINI API KEY is missing on client side.');
  }

  const ai = new GoogleGenAI({ apiKey });

  let difficultyStr = "Médio";

  let minQuestions = 10;
  let maxQuestions = 12;
  
  if (difficulty <= 33) {
    difficultyStr = "Fácil";
    minQuestions = 8;
    maxQuestions = 10;
  } else if (difficulty >= 100) {
    difficultyStr = "Difícil";
    minQuestions = 12;
    maxQuestions = 14;
  }

  const levelStr = educationLevel === 'fundamental' ? 'Ensino Fundamental' : 'Ensino Médio';

  const prompt = `Crie uma prova escolar seguindo RIGOROSAMENTE as especificações abaixo.
NÃO repita as questões no final. Gere apenas UMA VEZ cada questão.

Foco: ${levelStr}
Tema: ${topic}
Matéria: ${subject}

1. Quantidade de questões baseada na dificuldade:
- Nível selecionado: ${difficultyStr}
- Gere EXATAMENTE entre ${minQuestions} e ${maxQuestions} questões.
- Não gere conteúdo extra além das questões solicitadas.

2. Conteúdo e Estilo (MUITO IMPORTANTE):
- A prova deve ser formatada e com conteúdo focado em alunos do ${levelStr}.
- A prova deve focar no tema solicitado.
- LINGUAGEM: Use linguagem simples, clara, natural e direta (como um professor de escola real). EVITE palavras rebuscadas ou excessivamente formais (como "concomitantemente", "avassaladoramente", "intrínseco", etc).
- TAMANHO: As questões devem ser curtas e objetivas (máximo de 3 a 5 linhas por enunciado). SEM enrolação. As alternativas também devem ser curtas e diretas, sem explicações longas.
- DIFICULDADE: A dificuldade (${difficultyStr}) deve vir da exigência do raciocínio lógico e do conhecimento da matéria, NÃO de textos longos ou interpretação de texto complicada. O aluno deve entender o problema rapidamente. Foco na matéria, não na interpretação de vocabulário difícil.

3. Formato das questões de Múltipla Escolha:
- Cada questão DEVE ter o enunciado e logo abaixo as 4 alternativas (A, B, C, D).
- NÃO mostrar o gabarito.

4. Espaçamento para resposta (MUITO IMPORTANTE):
- Para questões de múltipla escolha ou dissertativas, certifique-se de que a resposta (ou alternativas) fiquem logo abaixo da pergunta correspondente.
- DÊ UM ESPAÇO MÉDIO DE PELO MENOS 3 LINHAS ENTRE UMA QUESTÃO E OUTRA. Para garantir isso, apenas adicione o separador horizontal "---" entre cada questão. Nós formataremos esse separador no sistema para fornecer o espaço adequado.

5. Organização visual:
- Separar bem cada questão com ---.
- NÃO CRIE uma seção extra no final chamada "Respostas do aluno", "Gabarito" ou qualquer repetição das questões.

6. Estrutura OBRIGATÓRIA de cada questão (use exatamente este padrão):

Questão 1
(Enunciado da pergunta aqui)

A) Alternativa
B) Alternativa
C) Alternativa
D) Alternativa

---

Questão 2
(Enunciado da pergunta aqui)

A) Alternativa
B) Alternativa
C) Alternativa
D) Alternativa

---

(continue até o número final de questões indicadas)

E NADA MAIS APÓS A ÚLTIMA QUESTÃO. NÃO GERE quadro de respostas ou seção com "Respostas do aluno".
Objetivo: Criar uma prova limpa, pronta para impressão, sem repetições.`;

  try {
    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    
    let text = aiResponse.text || "";
    // Remove "Respostas do aluno" or similar sections at the end
    text = text.replace(/(?:^|\n)(?:\*\*|### )?(?:Respostas do aluno|Gabarito|Folha de respostas).*/is, "");
    
    return text;
  } catch (error) {
    console.error("Error generating exam:", error);
    throw new Error("Falha ao gerar a prova. Tente novamente.");
  }
}
