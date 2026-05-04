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
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao comunicar com a API do servidor');
    }
  } catch (err: any) {
    console.error("Erro na chamada da API /api/fix-exam:", err);
    throw new Error(err.message || 'Falha na conexão com o servidor.');
  }
}

export async function generateExam(subject: string, topic: string, difficulty: number, educationLevel: 'fundamental' | 'medio' = 'fundamental') {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, topic, difficultyValue: difficulty, educationLevel })
    });

    if (response.ok) {
      const data = await response.json();
      return data.text;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao comunicar com a API do servidor');
    }
  } catch (err: any) {
    console.error("Erro na chamada da API /api/generate:", err);
    throw new Error(err.message || 'Falha na conexão com o servidor.');
  }
}
