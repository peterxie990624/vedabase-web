import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import { useSBIndex, useSBCantoData } from '../hooks/useData';
import type { Language , VedaTheme} from '../types';

interface SBSectionsPageProps {
  chapterId: number;
  onBack: () => void;
  onHome: () => void;
  onSelectSection: (chapterId: number, sectionIndex: number) => void;
  language: Language;
  theme?: VedaTheme;
}

export default function SBSectionsPage({ chapterId, onBack, onHome, onSelectSection, language, theme = 'light' }: SBSectionsPageProps) {
  const { data: index } = useSBIndex();

  // Find canto for this chapter
  const chapter = index?.chapters.find(c => c.id === chapterId);
  const cantoId = chapter?.canto_id || null;

  const { data: cantoData, loading } = useSBCantoData(cantoId);

  const sections = cantoData?.sections[String(chapterId)] || [];

  const chapterTitle = chapter
    ? (language === 'zh'
        ? `${chapter.zh_name} ${chapter.zh_title || ''}`
        : `${chapter.en_name} ${chapter.en_title || ''}`)
    : '...';

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
        <div style={{ background: 'var(--veda-bg)' }}>
          {/* Chapter header */}
          <div className="canto-header" style={{ position: 'sticky', top: '56px', zIndex: 10 }}>
            {chapterTitle}
          </div>

          {sections.map((section, idx) => {
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
                        minWidth: '56px',
                        flexShrink: 0,
                      }}
                    >
                      SB {section.section_id}
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
