import React from 'react';
import TopNav from '../components/TopNav';
import { useBGData } from '../hooks/useData';
import type { Language , VedaTheme} from '../types';

interface BGSectionsPageProps {
  chapterId: number;
  onBack: () => void;
  onHome: () => void;
  onSelectSection: (chapterId: number, sectionIndex: number) => void;
  language: Language;
  theme?: VedaTheme;
}

export default function BGSectionsPage({
  chapterId,
  onBack,
  onHome,
  onSelectSection,
  language,
  theme = 'light',
}: BGSectionsPageProps) {
  const isDark = theme === 'dark';
  const { data, loading } = useBGData();

  const chapter = data?.chapters.find(c => c.id === chapterId);
  const sections = data?.sections[String(chapterId)] || [];

  const title = chapter
    ? `${chapter.zh_name} ${language === 'zh' ? chapter.zh_title : chapter.en_title}`
    : '...';

  return (
    <div style={{ paddingTop: '56px', paddingBottom: '60px', minHeight: '100vh', background: 'var(--veda-bg)' }}>
      <TopNav
        title={language === 'zh' ? '博伽梵歌' : 'Bhagavad-gītā'}
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
        <div style={{ background: 'var(--veda-bg)' }}>
          {/* Chapter header */}
          <div className="canto-header" style={{ position: 'sticky', top: '56px', zIndex: 10 }}>
            {title}
          </div>

          {sections.map((section, idx) => {
            // Get preview text
            const preview = language === 'zh'
              ? (section.yw_zh || section.yz_zh || '')
              : (section.yw_en || section.yz_en || '');
            const previewText = preview
              .replace(/<[^>]+>/g, '')
              .trim()
              .slice(0, 40);

            return (
              <div
                key={section.id}
                className="list-item"
                onClick={() => onSelectSection(chapterId, idx)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <span
                      style={{
                        color: 'var(--veda-blue)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        minWidth: '48px',
                        flexShrink: 0,
                      }}
                    >
                      BG {section.section_id}
                    </span>
                    <span
                      style={{
                        color: '#555',
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {previewText}
                      {previewText.length >= 40 ? '...' : ''}
                    </span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0c8dc" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
