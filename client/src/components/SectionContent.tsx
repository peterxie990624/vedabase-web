import React, { useMemo, useRef, useEffect } from 'react';
import type { Language, FontSize, VedaTheme } from '../types';

interface SectionContentProps {
  verseText: string | null;
  wordForWordSanskrit: string | null;
  wordForWordLang: string | null;
  translation: string | null;
  purport: string | null;
  language: Language;
  fontSize: FontSize;
  theme?: VedaTheme;
  onShare?: () => void;
  searchKeyword?: string;
  // Phase 2: 多位置高亮支持
  highlightKeyword?: string;  // 要高亮的关键词（可能与 searchKeyword 不同）
  highlightKeywordZh?: string;  // 中文高亮关键词（用于中文模式）
  highlightKeywordEn?: string;  // 英文高亮关键词（用于英文模式）
  matchLocation?: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport'; // 关键词匹配的位置
}

const fontSizePx: Record<FontSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

function parseVerseText(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&emsp;/g, '  ')
    .replace(/&nbsp;/g, ' ')
    .replace(/<i>/gi, '')
    .replace(/<\/i>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseWordForWord(sanskrit: string, translation: string): Array<{ sk: string; tr: string }> {
  const skWords = sanskrit.split(';').map(s => s.trim()).filter(Boolean);
  const trWords = translation.split(';').map(s => s.trim()).filter(Boolean);
  const result: Array<{ sk: string; tr: string }> = [];
  const len = Math.max(skWords.length, trWords.length);
  for (let i = 0; i < len; i++) {
    result.push({ sk: skWords[i] || '', tr: trWords[i] || '' });
  }
  return result;
}

// 梵文规范化：将带变音符号的梵文字母转为基本拉丁字母（用于搜索匹配）
function normalizeSanskrit(text: string): string {
  return text
    .replace(/[āàáâãäå]/g, 'a')
    .replace(/[ēèéêë]/g, 'e')
    .replace(/[īìíîï]/g, 'i')
    .replace(/[ōòóôõö]/g, 'o')
    .replace(/[ūùúûü]/g, 'u')
    .replace(/[ṭṫ]/g, 't')
    .replace(/[ḍḋ]/g, 'd')
    .replace(/[ṇṅñ]/g, 'n')
    .replace(/[śşš]/g, 's')
    .replace(/[ṣṡ]/g, 's')
    .replace(/[ḥḣ]/g, 'h')
    .replace(/[ṛṝ]/g, 'r')
    .replace(/[ṁṃṀṂ]/g, 'm')
    .replace(/[ḷḹ]/g, 'l')
    .replace(/[čć]/g, 'c')
    .replace(/[ḏ]/g, 'd')
    .replace(/[ṯ]/g, 't')
    .toLowerCase();
}

function sanitizePurport(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/class="[^"]*"/gi, '')
    .replace(/property="[^"]*"/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<h[1-6][^>]*>/gi, '<strong>')
    .replace(/<\/h[1-6]>/gi, '</strong><br/>')
    .trim();
}

export default function SectionContent({
  verseText,
  wordForWordSanskrit,
  wordForWordLang,
  translation,
  purport,
  language,
  fontSize,
  theme = 'light',
  onShare,
  searchKeyword,
  highlightKeyword,
  highlightKeywordZh,
  highlightKeywordEn,
  matchLocation,
}: SectionContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to first highlighted match when searchKeyword is provided
  // 注意：添加language依赖，当语言切换时也需要重新滚动到高亮位置
  useEffect(() => {
    if (!searchKeyword && !highlightKeyword) return;
    const timer = setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;
      const mark = el.querySelector('mark.search-highlight') as HTMLElement | null;
      if (mark) {
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword, highlightKeyword, highlightKeywordZh, highlightKeywordEn, language]);

  const fsPx = fontSizePx[fontSize];
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const parsedVerse = useMemo(() => {
    if (!verseText) return null;
    return parseVerseText(verseText);
  }, [verseText]);

  const wordPairs = useMemo(() => {
    if (!wordForWordSanskrit || !wordForWordLang) return null;
    return parseWordForWord(wordForWordSanskrit, wordForWordLang);
  }, [wordForWordSanskrit, wordForWordLang]);

  const cleanPurport = useMemo(() => {
    if (!purport) return null;
    return sanitizePurport(purport);
  }, [purport]);

  const verseBoxStyle: React.CSSProperties = isDark ? {
    background: '#1e2e42',
    border: '1px dashed #3a5070',
    borderRadius: '8px',
    padding: '20px 24px',
    textAlign: 'center',
    margin: '16px 0',
  } : undefined as any;

  const dividerStyle: React.CSSProperties = {
    border: 'none',
    borderTop: `1px solid ${isDark ? '#2a3a50' : 'var(--veda-border)'}`,
    margin: '12px 0',
  };

  const sectionHeaderStyle: React.CSSProperties = isDark ? {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#c8a84b',
    fontWeight: 600,
    fontSize: `${fsPx}px`,
    margin: '20px 0 10px',
    paddingBottom: '6px',
    borderBottom: '1px solid #2a3a50',
  } : {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    fontSize: `${fsPx}px`,
    margin: '20px 0 10px',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--veda-border)',
    color: 'var(--veda-blue)',
  };

  // 根据当前语言动态生成高亮关键词
  // 这样当语言切换时，高亮关键词会自动更新
  const currentKeyword = useMemo(() => {
    if (language === 'zh') {
      return highlightKeywordZh || highlightKeyword || searchKeyword;
    } else {
      return highlightKeywordEn || highlightKeyword || searchKeyword;
    }
  }, [language, highlightKeywordZh, highlightKeywordEn, highlightKeyword, searchKeyword]);

  // Highlight search keyword in text
  // v4: 支持中英文切换时的高亮
  // 重要：根据当前语言模式选择对应的高亮关键词
  const highlightText = (html: string, location?: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport'): string => {
    // 使用动态生成的高亮关键词
    let keyword = currentKeyword;
    if (!keyword) return html;
    
    // 如果指定了matchLocation，只在匹配的位置高亮
    if (matchLocation && location && matchLocation !== location) {
      return html;
    }
    
    // 先尝试直接匹配（对中文、英文、梵文都有效）
    // 这是最重要的一步，因为中文关键词无法通过梵文规范化匹配
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const directRegex = new RegExp(escaped, 'gi');
    if (directRegex.test(html)) {
      return html.replace(
        new RegExp(escaped, 'gi'),
        match => `<mark class="search-highlight" style="background:#d4a017;color:#1a1a1a;border-radius:2px;padding:0 2px;font-weight:700;display:inline">${match}</mark>`
      );
    }
    
    // 梵文规范化匹配：逐字扫描，找到匹配的原始字符串并高亮
    // 注意：对于中文关键词，normalizeSanskrit会返回空字符串，此时直接返回html
    const normalizedKw = normalizeSanskrit(keyword);
    if (!normalizedKw) return html;  // 中文关键词无法规范化，返回原始html（直接匹配已失败）
    
    let result = '';
    let i = 0;
    const normalizedHtml = normalizeSanskrit(html);
    
    while (i < html.length) {
      if (normalizedHtml.slice(i, i + normalizedKw.length) === normalizedKw) {
        const original = html.slice(i, i + normalizedKw.length);
        result += `<mark class="search-highlight" style="background:#d4a017;color:#1a1a1a;border-radius:2px;padding:0 2px;font-weight:700;display:inline">${original}</mark>`;
        i += normalizedKw.length;
      } else {
        result += html[i];
        i++;
      }
    }
    
    // 如果没有任何匹配，返回原始文本
    return result === html ? html : result;
  };

  return (
    <div ref={contentRef} style={{ padding: '16px', fontSize: `${fsPx}px` }}>
      {/* Verse box */}
      {parsedVerse && (
        <div className={isDark ? '' : 'verse-box'} style={isDark ? verseBoxStyle : undefined}>
          <pre
            className="sanskrit-text"
            style={{
              whiteSpace: 'pre-wrap',
              margin: 0,
              fontSize: `${fsPx}px`,
              textAlign: 'center',
              fontFamily: "'Gentium Book Plus', 'Times New Roman', serif",
              fontStyle: 'italic',
              lineHeight: 1.9,
              color: isDark ? '#d8d0b8' : undefined,
            }}
            dangerouslySetInnerHTML={{ __html: highlightText(parsedVerse, 'sanskrit') }}
          />
        </div>
      )}

      {/* Word for word */}
      {wordPairs && wordPairs.length > 0 && (
        <div style={{ marginBottom: '16px', lineHeight: 2, fontSize: `${fsPx - 1}px` }}>
          {wordPairs.map((pair, i) => (
            <React.Fragment key={i}>
              {pair.sk && (
                <>
                  <span 
                    className="sanskrit-word" 
                    style={isDark ? { color: '#e8c060' } : undefined}
                    dangerouslySetInnerHTML={{ __html: highlightText(pair.sk, 'wordmeaning') }}
                  />
                  {pair.tr && (
                    <span 
                      style={{ color: isDark ? '#a8b8c8' : 'var(--veda-text)' }}
                      dangerouslySetInnerHTML={{ __html: ' -' + highlightText(pair.tr, 'wordmeaning') + ' ' }}
                    />
                  )}
                </>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Divider */}
      {(wordPairs || parsedVerse) && translation && (
        <hr style={dividerStyle} />
      )}

      {/* Translation */}
      {translation && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionHeaderStyle}>
            <span>📖</span>
            <span>{isEn ? 'Translation' : '译文'}</span>
          </div>
          {translation.includes('<') ? (
            <div
              className="translation-text"
              style={{ fontSize: `${fsPx}px`, paddingLeft: '8px', color: isDark ? '#7ab8d8' : undefined }}
              dangerouslySetInnerHTML={{ __html: highlightText(sanitizePurport(translation), 'translation') }}
            />
          ) : (
            <div
              className="translation-text"
              style={{ fontSize: `${fsPx}px`, paddingLeft: '8px', color: isDark ? '#7ab8d8' : undefined }}
              dangerouslySetInnerHTML={{ __html: highlightText(translation, 'translation') }}
            />
          )}
        </div>
      )}

      {/* Purport */}
      {cleanPurport && (
        <div>
          <div style={sectionHeaderStyle}>
            <span>📋</span>
            <span>{isEn ? 'Purport' : '要旨'}</span>
          </div>
          <div
            className="purport-text"
            style={{ fontSize: `${fsPx}px`, color: isDark ? '#c0b8a8' : undefined }}
            dangerouslySetInnerHTML={{ __html: highlightText(cleanPurport, 'purport') }}
          />
        </div>
      )}

      {/* Share button */}
      {onShare && (translation || purport) && (
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${isDark ? '#2a3a50' : 'var(--veda-border)'}`, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: `${Math.round(fsPx * 0.5)}px ${Math.round(fsPx * 1.2)}px`,
              background: isDark ? 'rgba(232,213,163,0.1)' : 'rgba(46,111,160,0.08)',
              border: `1px solid ${isDark ? '#c8a84b' : '#2e6fa0'}`,
              borderRadius: '20px',
              cursor: 'pointer',
              color: isDark ? '#c8a84b' : '#2e6fa0',
              fontSize: `${fsPx - 1}px`,
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(232,213,163,0.2)' : 'rgba(46,111,160,0.15)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(232,213,163,0.1)' : 'rgba(46,111,160,0.08)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
            onMouseDown={e => (e.currentTarget as HTMLElement).style.transform = 'scale(0.96)'}
            onMouseUp={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'}
          >
            <span>📋</span>
            <span>{isEn ? 'Copy Scripture / 复制经典' : '复制经典 / Copy Scripture'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
