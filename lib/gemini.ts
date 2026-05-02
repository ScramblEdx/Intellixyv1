import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateExam(subject: string, topic: string, difficulty: number, educationLevel: 'fundamental' | 'medio' = 'fundamental') {
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

2. Conteúdo:
- A prova deve ser formatada e com conteúdo focado em alunos do ${levelStr}.
- A prova deve focar no tema solicitado.
- Dificuldade deve afetar a complexidade das perguntas e alternativas.

3. Formato das questões de Múltipla Escolha:
- Cada questão DEVE ter o enunciado e logo abaixo as 4 alternativas (A, B, C, D).
- NÃO mostrar o gabarito.

4. Espaçamento para resposta (MUITO IMPORTANTE):
- Para questões de múltipla escolha ou dissertativas, certifique-se de que a resposta (ou alternativas) fiquem logo abaixo da pergunta correspondente.

5. Organização visual:
- Separar bem cada questão.
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
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    
    let text = response.text || "";
    // Remove "Respostas do aluno" or similar sections at the end
    text = text.replace(/(?:^|\n)(?:\*\*|### )?(?:Respostas do aluno|Gabarito|Folha de respostas).*/is, "");
    
    return text;
  } catch (error) {
    console.error("Error generating exam:", error);
    throw new Error("Falha ao gerar a prova. Tente novamente.");
  }
}
