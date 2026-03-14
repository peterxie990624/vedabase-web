import React from 'react';
import TopNav from '../components/TopNav';
import { useSBIndex } from '../hooks/useData';
import type { Language , VedaTheme} from '../types';

interface SBCantosPageProps {
  onBack: () => void;
  onHome: () => void;
  onSelectCanto: (cantoId: number) => void;
  language: Language;
  theme?: VedaTheme;
}

export default function SBCantosPage({ onBack, onHome, onSelectCanto, language, theme = 'light' }: SBCantosPageProps) {
  const { data, loading } = useSBIndex();

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
          {data?.cantos.map((canto) => {
            const label = language === 'zh' ? canto.zh_name : canto.en_name;
            const subtitle = language === 'zh'
              ? (canto.zh_subtitle || '')
              : (canto.en_subtitle || '');
            return (
              <div
                key={canto.id}
                className="list-item"
                onClick={() => onSelectCanto(canto.id)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span
                      style={{
                        color: '#8aa0b4',
                        fontSize: '0.85rem',
                        minWidth: '60px',
                        fontFamily: "'Noto Serif SC', serif",
                        flexShrink: 0,
                      }}
                    >
                      {label}
                    </span>
                    {subtitle && (
                      <span
                        style={{
                          color: 'var(--veda-text)',
                          fontSize: '0.95rem',
                          fontFamily: "'Noto Serif SC', serif",
                        }}
                      >
                        {subtitle}
                      </span>
                    )}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0c8dc" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            );
          })}
          <div style={{ padding: '16px', textAlign: 'center', color: '#b0c8dc', fontSize: '13px' }}>
            已经加载到最后
          </div>
        </div>
      )}
    </div>
  );
}
