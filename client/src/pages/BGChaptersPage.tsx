import React from 'react';
import TopNav from '../components/TopNav';
import { useBGData } from '../hooks/useData';
import type { Language } from '../types';

interface BGChaptersPageProps {
  onBack: () => void;
  onHome: () => void;
  onSelectChapter: (chapterId: number) => void;
  language: Language;
}

export default function BGChaptersPage({ onBack, onHome, onSelectChapter, language }: BGChaptersPageProps) {
  const { data, loading } = useBGData();

  return (
    <div style={{ paddingTop: '56px', paddingBottom: '60px', minHeight: '100vh', background: 'var(--veda-bg)' }}>
      <TopNav
        title={language === 'zh' ? '博伽梵歌原义' : 'Bhagavad-gītā As It Is'}
        onBack={onBack}
        onHome={onHome}
      />

      {loading ? (
        <div className="loading-spinner">
          <div style={{ textAlign: 'center', color: 'var(--veda-blue)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
            <div>加载中...</div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'white' }}>
          {data?.chapters.map((chapter, idx) => (
            <div
              key={chapter.id}
              className="list-item"
              onClick={() => onSelectChapter(chapter.id)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span
                    style={{
                      color: '#8aa0b4',
                      fontSize: '0.85rem',
                      minWidth: '56px',
                      fontFamily: "'Noto Serif SC', serif",
                    }}
                  >
                    {chapter.zh_name}
                  </span>
                  <span
                    style={{
                      color: 'var(--veda-text)',
                      fontSize: '0.95rem',
                      fontFamily: "'Noto Serif SC', serif",
                    }}
                  >
                    {language === 'zh' ? chapter.zh_title : chapter.en_title}
                  </span>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0c8dc" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
