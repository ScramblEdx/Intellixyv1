import React from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ExamLayoutProps {
  subject: string;
  level?: string;
  content: string;
  isPdf?: boolean;
}

export function ExamLayout({ subject, level = 'Ensino Fundamental', content, isPdf = false }: ExamLayoutProps) {
  return (
    <div className="exam-container bg-white text-black w-full mx-auto" style={{ padding: isPdf ? '40px' : '30px', maxWidth: isPdf ? '210mm' : '900px', minHeight: isPdf ? '297mm' : 'auto', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', fontWeight: '500' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              Nome do aluno: <span style={{ display: 'inline-block', borderBottom: '1px solid #000', width: 'calc(100% - 130px)', minWidth: '150px' }}></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '120px' }}>
              Data: <span style={{ display: 'inline-block', borderBottom: '1px solid #000', width: '80%' }}></span>
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              Turma: <span style={{ display: 'inline-block', borderBottom: '1px solid #000', width: '70%' }}></span>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              Professor(a): <span style={{ display: 'inline-block', borderBottom: '1px solid #000', width: '60%' }}></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
            <div>
              Disciplina: <strong style={{ fontWeight: 'bold', marginLeft: '4px' }}>{subject}</strong>
            </div>
            <div style={{ fontSize: '13px', fontStyle: 'italic' }}>
              Instruções: Evite rasuras e borrões.
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="markdown-body" style={{ color: '#000', fontSize: '16px', lineHeight: '1.6', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
        <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{content}</Markdown>
      </div>
    </div>
  );
}
