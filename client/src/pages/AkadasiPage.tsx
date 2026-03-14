import React, { useState } from 'react';
import TopNav from '../components/TopNav';
import { useAkadasiData } from '../hooks/useData';
import { useBookmarks } from '../hooks/useBookmarks';
import { useSettings } from '../hooks/useSettings';
import type { Language, FontSize , VedaTheme} from '../types';

interface AkadasiPageProps {
  onBack: () => void;
  onHome: () => void;
  theme?: VedaTheme;
}

const fontSizeCycle: FontSize[] = ['sm', 'md', 'lg', 'xl'];

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/class="[^"]*"/gi, '')
    .replace(/<div[^>]*>/gi, '<p>')
    .replace(/<\/div>/gi, '</p>')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .trim();
}

export default function AkadasiPage({ onBack, onHome, theme = 'light' }: AkadasiPageProps) {
  const { data, loading } = useAkadasiData();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { language, setLanguage, fontSize, setFontSize } = useSettings();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const chapters = data?.chapters || [];
  const selectedChapter = chapters.find(c => c.id === selectedId);

  const cycleFontSize = () => {
    const idx = fontSizeCycle.indexOf(fontSize);
    setFontSize(fontSizeCycle[(idx + 1) % fontSizeCycle.length]);
  };

  const fontSizePx: Record<FontSize, number> = { sm: 14, md: 16, lg: 18, xl: 20 };

  if (selectedChapter) {
    const content = language === 'zh' ? selectedChapter.zh_gs : (selectedChapter.en_gs || selectedChapter.zh_gs);
    const cleanContent = content ? sanitizeHtml(content) : '';
    const bookmarked = isBookmarked('akadasi', selectedChapter.id);

    return (
      <div style={{ minHeight: '100vh', background: 'var(--veda-bg)' }}>
        <TopNav
          title={selectedChapter.zh_name}
          onBack={() => setSelectedId(null)}
          onHome={onHome}
          showBookmark
          isBookmarked={bookmarked}
          onBookmark={() => {
            const preview = cleanContent.replace(/<[^>]+>/g, '').slice(0, 50);
            toggleBookmark({
              bookType: 'akadasi',
              chapterId: selectedChapter.id,
              title: selectedChapter.zh_name,
              preview,
            });
          }}
          language={language}
          onLanguageToggle={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          fontSize={fontSize}
          onFontSize={cycleFontSize}
        />
        <div style={{ paddingTop: '56px', paddingBottom: '80px', padding: '72px 16px 80px' }}>
          {selectedChapter.pjsj && (
            <div
              style={{
                background: 'var(--veda-blue-light)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '13px',
                color: 'var(--veda-blue-dark)',
                fontStyle: 'italic',
              }}
              dangerouslySetInnerHTML={{ __html: selectedChapter.pjsj.replace(/<br\/>/g, '<br>') }}
            />
          )}
          {cleanContent ? (
            <div
              className="purport-text"
              style={{ fontSize: `${fontSizePx[fontSize]}px` }}
              dangerouslySetInnerHTML={{ __html: cleanContent }}
            />
          ) : (
            <div style={{ color: '#8aa0b4', textAlign: 'center', padding: '40px' }}>
              暂无内容
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '56px', paddingBottom: '60px', minHeight: '100vh', background: 'var(--veda-bg)' }}>
      <TopNav
        title={language === 'zh' ? '爱卡达西' : 'Ekādaśī'}
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
          {chapters.map(chapter => (
            <div
              key={chapter.id}
              className="list-item"
              onClick={() => setSelectedId(chapter.id)}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: 'var(--veda-text)',
                    fontSize: '0.95rem',
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                >
                  {chapter.zh_name}
                </div>
                {chapter.en_name && (
                  <div style={{ color: '#8aa0b4', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '2px' }}>
                    {chapter.en_name}
                  </div>
                )}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0c8dc" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          ))}
          <div style={{ padding: '16px', textAlign: 'center', color: '#b0c8dc', fontSize: '13px' }}>
            已经加载到最后
          </div>
        </div>
      )}
    </div>
  );
}
