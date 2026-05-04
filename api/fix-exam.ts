export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { content } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API KEY EXISTS (fix-exam):", !!apiKey);

    if (!apiKey) {
      return res.status(500).json({ message: 'API key não configurada no servidor' });
    }

    const prompt = `Analise a prova ou conteúdo educacional abaixo e faça correções de formatação, ortografia e consistência.
Mantenha a mesma quantidade de questões e alternativas. Apenas melhore a qualidade visual e corrija erros.
Certifique-se de usar o mesmo formato de prova (Questão seguida por alternativas A, B, C, D).

IMPORTANTE 1: Simplifique a linguagem (evite palavras excessivamente formais ou rebuscadas) e encurte os enunciados onde possível (buscando ter de 3 a 5 linhas), tornando a leitura mais rápida e objetiva, sem perder o nível técnico da questão.
IMPORTANTE 2: Remova todas as tags "<br><br><br>" que encontrar e use apenas "---" (uma linha horizontal) entre as questões para criar a separação. Nenhuma tag HTML deve ser deixada na prova.

CONTEÚDO ORIGINAL:
${content}

Escreva abaixo a versão corrigida (e apenas a versão corrigida, sem introduções):`;

    console.log("Chamando Gemini (fix-exam)...");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    console.log("Status resposta (fix-exam):", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error details (fix-exam):", errorData);
      return res.status(response.status).json({ 
        message: `Erro na API do Gemini: ${response.statusText}`,
        details: errorData 
      });
    }

    const data = await response.json();
    
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/(?:^|\n)(?:\*\*|### )?(?:Respostas do aluno|Gabarito|Folha de respostas).*/is, "");
    
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error("Vercel Serverless Error fixing exam:", error);
    return res.status(500).json({ message: error.message || "Falha ao refazer a prova. Tente novamente." });
  }
}
