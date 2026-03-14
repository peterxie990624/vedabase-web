import React from 'react';
import TopNav from '../components/TopNav';
import { useSBIndex } from '../hooks/useData';
import type { Language , VedaTheme} from '../types';

interface SBChaptersPageProps {
  cantoId: number;
  onBack: () => void;
  onHome: () => void;
  onSelectChapter: (chapterId: number) => void;
  language: Language;
  theme?: VedaTheme;
}

export default function SBChaptersPage({ cantoId, onBack, onHome, onSelectChapter, language, theme = 'light' }: SBChaptersPageProps) {
  const { data, loading } = useSBIndex();

  const canto = data?.cantos.find(c => c.id === cantoId);
  const chapters = data?.chapters.filter(c => c.canto_id === cantoId) || [];

  const cantoLabel = canto
    ? (language === 'zh' ? canto.zh_name : canto.en_name)
    : '...';
  const cantoSubtitle = canto
    ? (language === 'zh' ? (canto.zh_subtitle || '') : (canto.en_subtitle || ''))
    : '';
  const cantoTitle = cantoSubtitle ? `${cantoLabel} ${cantoSubtitle}` : cantoLabel;

  return (
    <div style={{ paddingTop: '56px', paddingBottom: '60px', minHeight: '100vh', background: 'var(--veda-bg)' }}>
      <TopNav
        title={language === 'zh' ? '圣典博伽瓦谭' : 'Śrīmad-Bhāgavatam'}
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
          {/* Canto header */}
          <div className="canto-header" style={{ position: 'sticky', top: '56px', zIndex: 10 }}>
            {cantoTitle}
          </div>

          {chapters.map(chapter => (
            <div
              key={chapter.id}
              className="list-item"
              onClick={() => onSelectChapter(chapter.id)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span
                    style={{
                      color: 'var(--veda-blue)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      minWidth: '60px',
                      flexShrink: 0,
                    }}
                  >
                    {chapter.en_name}
                  </span>
                  <span
                    style={{
                      color: 'var(--veda-text)',
                      fontSize: '0.9rem',
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
