import React, { useState, useRef, useEffect } from 'react';
import type { SBCanto, SBChapter, SBSection } from '../types';

// 动画加载提示的CSS
const loadingDotsStyle = `
  @keyframes loading-dots {
    0%, 20% { content: '.'; }
    40% { content: '..'; }
    60%, 100% { content: '...'; }
  }
  .loading-dots::after {
    animation: loading-dots 1.5s infinite;
  }
`;

interface SBTableOfContentsProps {
  // 书籍类型
  bookType: 'sb' | 'bg';
  
  // 数据
  cantos: SBCanto[];
  chapters: SBChapter[];
  cantoData: { sections: Record<string, SBSection[]> } | null;
  cachedCantos?: Record<number, { sections: Record<string, SBSection[]> }>;
  
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
  onPreloadCanto?: (cantoId: number) => void;  // 预加载篇的数据
  onLoadChapterData?: (cantoId: number, chapterId: number) => Promise<void>;  // 动态加载章的数据
  loadedCantos?: Set<number>;  // 已加载的篇
  
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
  bookType,
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
  onPreloadCanto,
  onLoadChapterData,
  loadedCantos = new Set(),
  cachedCantos = {},
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
  const [loadingChapters, setLoadingChapters] = useState<Set<number>>(new Set());
  
  // 当打开TOC时，展开当前篇和当前章
  useEffect(() => {
    if (showToc && cantoId && chapterId) {
      setExpandedCantos(new Set([cantoId]));
      setExpandedChapters(new Set([chapterId]));
    }
  }, [showToc, cantoId, chapterId]);
  
  // 测量 TOC header 的高度
  useEffect(() => {
    if (!tocHeaderRef.current) return;
    const height = tocHeaderRef.current.offsetHeight;
    setTocHeaderHeight(height);
  }, [showToc]);
  
  // 处理目录滑动时的置顶块显示
  useEffect(() => {
    if (!showToc || !tocContainerRef.current) return;

    const handleScroll = () => {
      const container = tocContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const topBoundary = containerRect.top;

      // 只检查当前篇是否超过顶部（且被展开）
      let visibleCanto: string | null = null;
      if (bookType === 'sb' && cantoId && expandedCantos.has(cantoId)) {
        const cantoEl = container.querySelector(`[data-canto-id="${cantoId}"]`);
        if (cantoEl) {
          const rect = cantoEl.getBoundingClientRect();
          if (rect.bottom < topBoundary) {
            visibleCanto = cantoEl.getAttribute('data-canto-title');
          }
        }
      }

      // 只检查当前章是否超过顶部（且被展开）
      let visibleChapter: string | null = null;
      if (expandedChapters.has(chapterId)) {
        const chapterEl = container.querySelector(`[data-chapter-id="${chapterId}"]`);
        if (chapterEl) {
          const rect = chapterEl.getBoundingClientRect();
          if (rect.bottom < topBoundary) {
            visibleChapter = chapterEl.getAttribute('data-chapter-title');
          }
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


  
  const toggleCantoExpand = (id: number) => {
    setExpandedCantos(prev => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      } else {
        // 展开篇时，预加载该篇的数据
        if (onPreloadCanto && !loadedCantos.has(id)) {
          onPreloadCanto(id);
        }
        return new Set([id]);
      }
    });
  };

  const toggleChapterExpand = async (id: number) => {
    setExpandedChapters(prev => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        setLoadingChapters(new Set());  // 关闭时清除加载状态
        return next;
      } else {
        // 立即展开章
        const chapter = chapters.find(c => c.id === id);
        
        // 如果该篇的数据还没加载，就动态加载
        if (chapter && onLoadChapterData && !loadedCantos.has(chapter.canto_id)) {
          setLoadingChapters(prev => new Set([...prev, id]));  // 标记为加载中
          onLoadChapterData(chapter.canto_id, id).then(() => {
            setLoadingChapters(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            setTimeout(() => {
              const chapterEl = document.querySelector(`[data-chapter-id="${id}"]`);
              if (chapterEl) {
                chapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 0);
          });
        } else {
          setTimeout(() => {
            const chapterEl = document.querySelector(`[data-chapter-id="${id}"]`);
            if (chapterEl) {
              chapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 0);
        }
        
        return new Set([id]);
      }
    });
  };
  
  if (!showToc) return null;
  
  // 注入动画CSS
  if (typeof document !== 'undefined' && !document.getElementById('loading-dots-style')) {
    const style = document.createElement('style');
    style.id = 'loading-dots-style';
    style.textContent = loadingDotsStyle;
    document.head.appendChild(style);
  }
  
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
            {bookType === 'sb' 
              ? (isEn ? 'Śrīmad-Bhāgavatam' : '圣典博伽瓦谭')
              : (isEn ? 'Bhagavad Gita' : '薄伽梵歌')
            }
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
            e.preventDefault();
            const targetChapter = chapters.find(c => {
              const name = isEn ? c.en_name : c.zh_name;
              const title = isEn ? (c.en_title || c.zh_title || '') : (c.zh_title || c.en_title || '');
              const fullTitle = `${name} ${title}`;
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

        {bookType === 'sb' ? cantos.map(canto => {
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
                style={{ padding: '8px 16px', background: isCurrentCanto ? tocActiveBg : (isExpanded ? (isDark ? '#1f3a52' : '#d0dce8') : (isDark ? '#0f1923' : '#f5f7fa')), borderBottom: `1px solid ${tocBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleCantoExpand(canto.id)}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isCurrentCanto ? tocActiveColor : (isExpanded ? (isDark ? '#e8f0f8' : '#2a3f5f') : tocTextSecondary), letterSpacing: '0.05em', flex: 1 }}>
                  {cantoTitle}
                </div>
                <div 
                  style={{ fontSize: '0.7rem', color: isCurrentCanto ? tocActiveColor : (isExpanded ? (isDark ? '#e8f0f8' : '#2a3f5f') : tocTextSecondary), marginLeft: '8px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
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
                // 优先使用当前篇的数据，如果没有则使用缓存的篇数据
                const chSections = isChapterExpanded ? (cantoData?.sections[String(ch.id)] || cachedCantos[canto.id]?.sections[String(ch.id)] || []) : [];
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
                        background: isCurrentChapter ? tocActiveBg : (isChapterExpanded ? (isDark ? '#1f3a52' : '#d0dce8') : 'transparent'),
                        borderBottom: `1px solid ${tocBorder}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div 
                        style={{ fontSize: '0.82rem', fontWeight: 600, color: isCurrentChapter ? tocActiveColor : (isChapterExpanded ? (isDark ? '#e8f0f8' : '#2a3f5f') : tocTextSecondary), fontFamily: "'Noto Serif SC', serif", flex: 1, paddingLeft: '20px' }}
                      >
                        {fullChapterTitle}{loadingChapters.has(ch.id) ? <span className="loading-dots" style={{ marginLeft: '4px' }} /> : ''}
                      </div>
                      <div 
                        style={{ fontSize: '0.75rem', color: isCurrentChapter ? tocActiveColor : (isChapterExpanded ? (isDark ? '#e8f0f8' : '#2a3f5f') : tocTextSecondary), marginLeft: '8px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
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
          })
        : chapters.map(ch => {
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
                  data-chapter-title={fullChapterTitle}
                  onClick={() => {
                    toggleChapterExpand(ch.id);
                  }}
                  style={{
                    padding: '10px 16px',
                    background: isCurrentChapter ? tocActiveBg : (isChapterExpanded ? (isDark ? '#1f3a52' : '#d0dce8') : 'transparent'),
                    borderBottom: `1px solid ${tocBorder}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div 
                    style={{ fontSize: '0.82rem', fontWeight: 600, color: isCurrentChapter ? tocActiveColor : (isChapterExpanded ? (isDark ? '#e8f0f8' : '#2a3f5f') : tocTextSecondary), fontFamily: "'Noto Serif SC', serif", flex: 1 }}
                  >
                    {fullChapterTitle}{loadingChapters.has(ch.id) ? <span className="loading-dots" style={{ marginLeft: '4px' }} /> : ''}
                  </div>
                  <div 
                    style={{ fontSize: '0.75rem', color: isCurrentChapter ? tocActiveColor : (isChapterExpanded ? (isDark ? '#e8f0f8' : '#2a3f5f') : tocTextSecondary), marginLeft: '8px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
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
                      BG {sec.section_id}
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
      </div>
    </div>
  );
}
