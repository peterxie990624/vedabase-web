import React, { useState, useRef, useEffect } from 'react';
import type { SBCanto, SBChapter, SBSection } from '../types';

interface SBTableOfContentsProps {
  // 数据
  cantos: SBCanto[];
  chapters: SBChapter[];
  cantoData: { sections: Record<string, SBSection[]> } | null;
  
  // 当前位置
  chapterId: number;
  sectionIndex: number;
  cantoId: number | null;
  
  // 语言和主题
  language: 'zh' | 'en';
  theme: 'light' | 'dark';
  
  // 状态
  showToc: boolean;
  
  // 回调
  onNavigate: (chapterId: number, sectionIndex: number, direction: 'left' | 'right') => void;
  onCloseToc: () => void;
  
  // 颜色配置
  tocBg: string;
  tocPanelBg: string;
  tocBorder: string;
  tocTextPrimary: string;
  tocTextSecondary: string;
  tocActiveBg: string;
  tocActiveColor: string;
}

export default function SBTableOfContents({
  cantos,
  chapters,
  cantoData,
  chapterId,
  sectionIndex,
  cantoId,
  language,
  theme,
  showToc,
  onNavigate,
  onCloseToc,
  tocBg,
  tocPanelBg,
  tocBorder,
  tocTextPrimary,
  tocTextSecondary,
  tocActiveBg,
  tocActiveColor,
}: SBTableOfContentsProps) {
  const isDark = theme === 'dark';
  const isEn = language === 'en';
  
  const tocContainerRef = useRef<HTMLDivElement>(null);
  const tocHeaderRef = useRef<HTMLDivElement>(null);
  const [tocHeaderHeight, setTocHeaderHeight] = useState(60);
  const [stickyCantoTitle, setStickyCantoTitle] = useState<string | null>(null);
  const [stickyChapterTitle, setStickyChapterTitle] = useState<string | null>(null);
  const [expandedCantos, setExpandedCantos] = useState<Set<number>>(new Set());
  const [currentCantoId, setCurrentCantoId] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const initializedRef = useRef(false);
  
  // 初始化时，自动展开当前篇和当前章
  useEffect(() => {
    if (cantoId && chapterId && !initializedRef.current) {
      initializedRef.current = true;
      setExpandedCantos(new Set([cantoId]));
      setExpandedChapters(new Set([chapterId]));
    }
  }, []);
  
  // 测量 TOC header 的高度
  useEffect(() => {
    if (!tocHeaderRef.current) return;
    const height = tocHeaderRef.current.offsetHeight;
    setTocHeaderHeight(height);
  }, [showToc]);
  
  // 处理目录滑动时的浮动块显示
  useEffect(() => {
    if (!showToc || !tocContainerRef.current) return;

    const handleScroll = () => {
      const container = tocContainerRef.current;
      if (!container) return;

      const cantoElements = container.querySelectorAll('[data-canto-id]');
      const chapterElements = container.querySelectorAll('[data-chapter-id]');
      
      let visibleCanto: string | null = null;
      let visibleCantoId: number | null = null;
      let visibleChapter: string | null = null;
      let currentCantoIdLocal: number | null = null;
      const containerRect = container.getBoundingClientRect();

      const topBoundary = containerRect.top;

      const currentCantoEl = container.querySelector(`[data-canto-id="${cantoId}"]`);
      if (currentCantoEl) {
        const rect = currentCantoEl.getBoundingClientRect();
        if (rect.bottom < topBoundary) {
          visibleCanto = currentCantoEl.getAttribute('data-canto-title');
          visibleCantoId = cantoId;
        }
      }

      const currentChapterEl = container.querySelector(`[data-chapter-id="${chapterId}"]`);
      if (currentChapterEl) {
        const rect = currentChapterEl.getBoundingClientRect();
        if (rect.bottom < topBoundary) {
          visibleChapter = currentChapterEl.getAttribute('data-chapter-title');
        }
      }

      setStickyCantoTitle(visibleCanto);
      setStickyChapterTitle(visibleChapter);
    };

    const container = tocContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [showToc, expandedCantos, cantoId, chapterId]);

  // 打开目录时自动滑动到当前小节
  useEffect(() => {
    if (!showToc || !tocContainerRef.current) return;

    const timer = setTimeout(() => {
      const container = tocContainerRef.current;
      if (!container) return;

      const currentSectionEl = container.querySelector(`[data-section-id="${cantoData?.sections[String(chapterId)]?.[sectionIndex]?.section_id}"]`);
      if (currentSectionEl) {
        currentSectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const currentChapterEl = container.querySelector(`[data-chapter-id="${chapterId}"]`);
        if (currentChapterEl) {
          currentChapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [showToc, chapterId, sectionIndex, cantoData]);

  // 当打开TOC时，展开当前篇
  useEffect(() => {
    if (showToc && cantoId) {
      setCurrentCantoId(cantoId);
      setExpandedCantos(prev => new Set([...prev, cantoId]));
    }
  }, [showToc, cantoId]);
  
  const toggleCantoExpand = (id: number) => {
    setExpandedCantos(prev => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      } else {
        return new Set([id]);
      }
    });
  };

  const toggleChapterExpand = (id: number) => {
    setExpandedChapters(prev => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      } else {
        setTimeout(() => {
          const chapterEl = document.querySelector(`[data-chapter-id="${id}"]`);
          if (chapterEl) {
            chapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 0);
        return new Set([id]);
      }
    });
  };
  
  if (!showToc) return null;
  
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: tocBg, zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}
      onClick={onCloseToc}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '80%', maxWidth: '360px', height: '100%' }} onClick={e => e.stopPropagation()}>
        <div ref={tocHeaderRef} style={{ borderBottom: `1px solid ${tocBorder}`, background: tocPanelBg, padding: '20px 16px', zIndex: 11 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: tocTextPrimary, fontFamily: "'Noto Serif SC', serif", letterSpacing: '0.05em' }}>
            {isEn ? 'Table of Contents' : '目录'}
          </div>
          <div style={{ fontSize: '0.85rem', color: tocTextSecondary, marginTop: '4px', fontWeight: 500 }}>
            {isEn ? 'Śrīmad-Bhāgavatam' : '圣典博伽瓦谭'}
          </div>
        </div>

        {stickyCantoTitle && (
          <div style={{
            borderBottom: `1.5px solid ${isDark ? '#8aa0b4' : '#a0b0c0'}`,
            padding: '14px 16px',
            background: 'transparent',
          }}>
          <div style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: isDark ? '#d4a017' : '#b8860b',
            fontFamily: "'Noto Serif SC', serif",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            pointerEvents: 'auto',
            paddingLeft: '0px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const targetCanto = cantos.find(c => {
              const label = isEn ? c.en_name : c.zh_name;
              const subtitle = isEn ? (c.en_subtitle || '') : (c.zh_subtitle || '');
              const fullTitle = subtitle ? `${label} ${subtitle}` : label;
              return fullTitle === stickyCantoTitle;
            });
            if (targetCanto) {
              setTimeout(() => {
                const cantoEl = document.querySelector(`[data-canto-id="${targetCanto.id}"]`);
                if (cantoEl) {
                  cantoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 0);
            }
          }}>
            {stickyCantoTitle}
            </div>
          </div>
        )}

        {stickyChapterTitle && (
          <div style={{
            borderBottom: `1.5px solid ${isDark ? '#8aa0b4' : '#a0b0c0'}`,
            padding: '14px 16px',
            background: 'transparent',
          }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: isDark ? '#d4a017' : '#b8860b',
              fontFamily: "'Noto Serif SC', serif",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              pointerEvents: 'auto',
              paddingLeft: '20px',
            }}
            onClick={(e) => {
            e.stopPropagation();
            const targetChapter = chapters.find(ch => {
              const chapterName = isEn ? ch.en_name : ch.zh_name;
              const chapterTitle = isEn ? (ch.en_title || ch.zh_title || '') : (ch.zh_title || ch.en_title || '');
              const fullTitle = `${chapterName} ${chapterTitle}`;
              return fullTitle === stickyChapterTitle;
            });
            if (targetChapter) {
              setTimeout(() => {
                const chapterEl = document.querySelector(`[data-chapter-id="${targetChapter.id}"]`);
                if (chapterEl) {
                  chapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 0);
            }
          }}>
            {stickyChapterTitle}
            </div>
          </div>
        )}

        <div
          ref={tocContainerRef}
          style={{
            height: '100%',
            background: tocPanelBg,
            borderLeft: `1px solid ${tocBorder}`,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
          onClick={e => e.stopPropagation()}
        >

        {cantos.map(canto => {
          const cantoChapters = chapters.filter(c => c.canto_id === canto.id);
          const isCurrentCanto = cantoId === canto.id;
          const isExpanded = expandedCantos.has(canto.id);
          const cantoLabel = isEn ? canto.en_name : canto.zh_name;
          const cantoSubtitle = isEn ? (canto.en_subtitle || '') : (canto.zh_subtitle || '');
          const cantoTitle = cantoSubtitle ? `${cantoLabel} ${cantoSubtitle}` : cantoLabel;
          return (
            <div key={canto.id}>
              <div
                data-canto-id={canto.id}
                data-canto-title={cantoTitle}
                style={{ padding: '8px 16px', background: isCurrentCanto ? tocActiveBg : (isDark ? '#0f1923' : '#f5f7fa'), borderBottom: `1px solid ${tocBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleCantoExpand(canto.id)}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isCurrentCanto ? tocActiveColor : tocTextSecondary, letterSpacing: '0.05em', flex: 1 }}>
                  {cantoTitle}
                </div>
                <div 
                  style={{ fontSize: '0.7rem', color: isCurrentCanto ? tocActiveColor : tocTextSecondary, marginLeft: '8px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCantoExpand(canto.id);
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </div>
              </div>
              {isExpanded && cantoChapters.map(ch => {
                const isCurrentChapter = ch.id === chapterId;
                const isChapterExpanded = expandedChapters.has(ch.id);
                const chSections = isChapterExpanded ? (cantoData?.sections[String(ch.id)] || []) : [];
                const chapterName = isEn ? ch.en_name : ch.zh_name;
                const chapterTitle = isEn ? (ch.en_title || ch.zh_title || '') : (ch.zh_title || ch.en_title || '');
                const fullChapterTitle = `${chapterName} ${chapterTitle}`;
                return (
                  <div key={ch.id}>
                    <div
                      data-chapter-id={ch.id}
                      data-canto-id={canto.id}
                      data-chapter-title={fullChapterTitle}
                      onClick={() => {
                        toggleChapterExpand(ch.id);
                      }}
                      style={{
                        padding: '10px 16px',
                        background: isCurrentChapter ? tocActiveBg : 'transparent',
                        borderBottom: `1px solid ${tocBorder}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div 
                        style={{ fontSize: '0.82rem', fontWeight: 600, color: isCurrentChapter ? tocActiveColor : tocTextSecondary, fontFamily: "'Noto Serif SC', serif", flex: 1, paddingLeft: '20px' }}
                      >
                        {fullChapterTitle}
                      </div>
                      <div 
                        style={{ fontSize: '0.75rem', color: isCurrentChapter ? tocActiveColor : tocTextSecondary, marginLeft: '8px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapterExpand(ch.id);
                        }}
                      >
                        {isChapterExpanded ? '▼' : '▶'}
                      </div>
                    </div>

                    {isChapterExpanded && chSections && chSections.map((sec, idx) => (
                      <div
                        key={sec.id}
                        data-section-id={sec.section_id}
                        style={{
                          padding: '8px 16px 8px 40px',
                          background: (ch.id === chapterId && idx === sectionIndex) ? tocActiveBg : 'transparent',
                          borderBottom: `1px solid ${isDark ? '#1a2535' : '#f5f7fa'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                        onClick={() => {
                          onCloseToc();
                          onNavigate(ch.id, idx, idx > sectionIndex ? 'right' : 'left');
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: (ch.id === chapterId && idx === sectionIndex) ? tocActiveColor : tocTextSecondary, minWidth: '60px' }}>
                          SB {sec.section_id}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: (ch.id === chapterId && idx === sectionIndex) ? tocActiveColor : tocTextSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {((isEn ? sec.yw_en : sec.yw_zh) || '').replace(/<[^>]+>/g, '').trim().slice(0, 28)}
                          {(ch.id === chapterId && idx === sectionIndex) && ' ◀'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}
