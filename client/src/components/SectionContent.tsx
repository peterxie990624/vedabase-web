import React, { useMemo } from 'react';
import type { Language, FontSize } from '../types';

interface SectionContentProps {
  verseText: string | null;      // 梵文原文（含换行标记）
  wordForWordSanskrit: string | null;  // 梵文词（分号分隔）
  wordForWordLang: string | null;      // 对应语言词义（分号分隔）
  translation: string | null;    // 译文
  purport: string | null;        // 要旨（含HTML）
  language: Language;
  fontSize: FontSize;
}

const fontSizePx: Record<FontSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

// Parse verse text with HTML entities and line breaks
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

// Parse word-for-word: interleave Sanskrit and translation
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

// Sanitize HTML for purport (allow basic tags)
function sanitizePurport(html: string): string {
  // Remove dangerous tags but keep p, em, i, b, strong, br
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
}: SectionContentProps) {
  const fsPx = fontSizePx[fontSize];

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

  return (
    <div style={{ padding: '16px', fontSize: `${fsPx}px` }}>
      {/* Verse box */}
      {parsedVerse && (
        <div className="verse-box">
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
                  <span className="sanskrit-word">{pair.sk}</span>
                  {pair.tr && <span style={{ color: 'var(--veda-text)' }}> -{pair.tr} </span>}
                </>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Divider */}
      {(wordPairs || parsedVerse) && translation && (
        <hr style={{ border: 'none', borderTop: '1px solid var(--veda-border)', margin: '12px 0' }} />
      )}

      {/* Translation */}
      {translation && (
        <div style={{ marginBottom: '16px' }}>
          <div className="section-header">
            <span>📖</span>
            <span>{language === 'zh' ? '译文' : 'Translation'}</span>
          </div>
          {translation.includes('<') ? (
            <div
              className="translation-text"
              style={{ fontSize: `${fsPx}px`, paddingLeft: '8px' }}
              dangerouslySetInnerHTML={{ __html: sanitizePurport(translation) }}
            />
          ) : (
            <div
              className="translation-text"
              style={{ fontSize: `${fsPx}px`, paddingLeft: '8px' }}
            >
              {translation}
            </div>
          )}
        </div>
      )}

      {/* Purport */}
      {cleanPurport && (
        <div>
          <div className="section-header">
            <span>📋</span>
            <span>{language === 'zh' ? '要旨' : 'Purport'}</span>
          </div>
          <div
            className="purport-text"
            style={{ fontSize: `${fsPx}px` }}
            dangerouslySetInnerHTML={{ __html: cleanPurport }}
          />
        </div>
      )}
    </div>
  );
}
