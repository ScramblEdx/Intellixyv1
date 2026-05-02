import React from 'react';
import Markdown from 'react-markdown';

interface ExamLayoutProps {
  subject: string;
  level?: string;
  content: string;
}

export function ExamLayout({ subject, level = 'Ensino Fundamental', content }: ExamLayoutProps) {
  return (
    <div className="exam-container bg-white text-black w-full mx-auto rounded-sm" style={{ padding: '40px', maxWidth: '210mm', minHeight: '297mm', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', fontWeight: '500' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              Nome do aluno: <span style={{ display: 'inline-block', borderBottom: '1px solid #000', width: 'calc(100% - 130px)' }}></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              Data: <span style={{ display: 'inline-block', borderBottom: '1px solid #000', width: '100px' }}></span>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              Turma: <span style={{ display: 'inline-block', borderBottom: '1px solid #000', width: '80px' }}></span>
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              Professora: <span style={{ display: 'inline-block', borderBottom: '1px solid #000', width: '120px' }}></span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
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
      <div className="markdown-body" style={{ color: '#000', fontSize: '15px', lineHeight: '1.6' }}>
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
}
