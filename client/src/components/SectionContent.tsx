import React, { useMemo } from 'react';
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
}: SectionContentProps) {
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

  return (
    <div style={{ padding: '16px', fontSize: `${fsPx}px` }}>
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
          >
            {parsedVerse}
          </pre>
        </div>
      )}

      {/* Word for word */}
      {wordPairs && wordPairs.length > 0 && (
        <div style={{ marginBottom: '16px', lineHeight: 2, fontSize: `${fsPx - 1}px` }}>
          {wordPairs.map((pair, i) => (
            <React.Fragment key={i}>
              {pair.sk && (
                <>
                  <span className="sanskrit-word" style={isDark ? { color: '#e8c060' } : undefined}>
                    {pair.sk}
                  </span>
                  {pair.tr && (
                    <span style={{ color: isDark ? '#a8b8c8' : 'var(--veda-text)' }}>
                      {' '}-{pair.tr}{' '}
                    </span>
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
              dangerouslySetInnerHTML={{ __html: sanitizePurport(translation) }}
            />
          ) : (
            <div
              className="translation-text"
              style={{ fontSize: `${fsPx}px`, paddingLeft: '8px', color: isDark ? '#7ab8d8' : undefined }}
            >
              {translation}
            </div>
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
            dangerouslySetInnerHTML={{ __html: cleanPurport }}
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
            <span>{isEn ? 'Copy Verse / 复制经文' : '复制经文 / Copy Verse'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
