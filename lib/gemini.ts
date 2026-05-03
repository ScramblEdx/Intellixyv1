// lib/gemini.ts

export async function fixExamContent(content: string) {
  try {
    const response = await fetch('/api/fix-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error('API fix-exam failed');
    }

    const data = await response.json();
    return data.text;
  } catch (err) {
    console.error("Erro ao corrigir prova:", err);
    throw new Error("Falha ao corrigir conteúdo");
  }
}

export async function generateExam(
  subject: string,
  topic: string,
  difficulty: number,
  educationLevel: 'fundamental' | 'medio' = 'fundamental'
) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, topic, difficultyValue: difficulty, educationLevel })
    });

    if (!response.ok) {
      throw new Error('API generate failed');
    }

    const data = await response.json();
    return data.text;
  } catch (err) {
    console.error("Erro ao gerar prova:", err);
    throw new Error("Falha ao gerar a prova. Tente novamente.");
  }
}
