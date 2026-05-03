import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { subject, topic, difficultyValue, educationLevel } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: 'GEMINI_API_KEY is not defined in environment variables.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    let difficultyStr = "Médio";
    let minQuestions = 10;
    let maxQuestions = 12;
    
    if (difficultyValue <= 33) {
      difficultyStr = "Fácil";
      minQuestions = 8;
      maxQuestions = 10;
    } else if (difficultyValue >= 100) {
      difficultyStr = "Difícil";
      minQuestions = 12;
      maxQuestions = 14;
    }

    const levelStr = educationLevel === 'fundamental'
      ? 'Ensino Fundamental'
      : 'Ensino Médio';

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

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    // 🔥 parsing blindado (sem mexer no prompt)
    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.text ||
      "";

    if (!text) {
      console.error("Resposta vazia do Gemini:", response);
      return res.status(500).json({
        message: "Gemini não retornou conteúdo válido."
      });
    }

    return res.status(200).json({ text });

  } catch (error: any) {
    console.error("Vercel Serverless Error generating exam:", error);

    return res.status(500).json({
      message: error.message || "Falha ao gerar a prova. Tente novamente."
    });
  }
}
