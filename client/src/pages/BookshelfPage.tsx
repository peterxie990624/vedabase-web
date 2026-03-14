// BookshelfPage — 书架主页
// Design: 支持风格1（夜间深色）和风格2（浅色），左上角齿轮设置下拉菜单
import React, { useState, useRef, useEffect } from 'react';
import { Settings, ChevronDown, ChevronRight } from 'lucide-react';
import AboutDialog from '../components/AboutDialog';
import type { Language, FontSize, VedaTheme } from '../types';
import { CDN } from '../constants';
import type { VedaTheme as VT } from '../hooks/useSettings';

interface BookshelfPageProps {
  onSelectBook: (bookId: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  theme: VT;
  setTheme: (t: VT) => void;
}

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'sm', label: '小' },
  { value: 'md', label: '中' },
  { value: 'lg', label: '大' },
  { value: 'xl', label: '特大' },
];

const books = [
  {
    id: 'bg',
    zhName: '博伽梵歌原义',
    enName: 'Bhagavad-gītā As It Is',
    description: '18章657节，含梵文原文、逐词释义、译文及要旨',
    cover: CDN.COVER_BG,
  },
  {
    id: 'sb',
    zhName: '圣典博伽瓦谭',
    enName: 'Śrīmad-Bhāgavatam',
    description: '12篇336章13002节，含中英双语',
    cover: CDN.COVER_SB,
  },
  {
    id: 'akadasi',
    zhName: '爱卡达西',
    enName: 'Ekādaśī',
    description: '101章，爱卡达西斋戒日的故事与规范',
    cover: CDN.COVER_EKADASI,
  },
];

export default function BookshelfPage({
  onSelectBook,
  language,
  setLanguage,
  fontSize,
  setFontSize,
  theme,
  setTheme,
}: BookshelfPageProps) {
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0f1923' : '#f5f7fa';
  const navBg = isDark ? '#1a2535' : '#ffffff';
  const navBorder = isDark ? '#2a3a50' : '#e0eaf2';
  const textPrimary = isDark ? '#e8d5a3' : '#1a3a5c';
  const textSecondary = isDark ? '#8aa0b4' : '#6a8aa0';
  const cardBg = isDark ? '#1a2535' : '#ffffff';
  const cardBorder = isDark ? '#2a3a50' : 'transparent';
  const dropdownBg = isDark ? '#1e2e42' : '#ffffff';
  const dropdownBorder = isDark ? '#2a3a50' : '#e0eaf2';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ paddingTop: '56px', paddingBottom: '70px', minHeight: '100vh', background: bg }}>
      {/* Top bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '640px',
          height: '56px',
          background: navBg,
          borderBottom: `1px solid ${navBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 100,
          boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(74,127,165,0.08)',
        }}
      >
        {/* Settings gear with dropdown */}
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettings(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: textSecondary,
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
            title="设置"
          >
            <Settings size={20} />
            <ChevronDown size={14} />
          </button>

          {/* Dropdown menu */}
          {showSettings && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                left: 0,
                background: dropdownBg,
                border: `1px solid ${dropdownBorder}`,
                borderRadius: '10px',
                padding: '8px 0',
                minWidth: '200px',
                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 200,
              }}
            >
              {/* Language */}
              <div style={{ padding: '8px 16px 4px', fontSize: '11px', color: textSecondary, fontWeight: 600, letterSpacing: '0.05em' }}>
                语言设置
              </div>
              <div style={{ borderBottom: `1px solid ${dropdownBorder}`, marginBottom: '4px' }} />
              {(['zh', 'en'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 16px',
                    background: language === lang ? (isDark ? 'rgba(232,213,163,0.1)' : 'rgba(74,127,165,0.08)') : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: language === lang ? (isDark ? '#e8d5a3' : '#2e6fa0') : (isDark ? '#c0d0e0' : '#444'),
                    fontSize: '14px',
                    fontWeight: language === lang ? 600 : 400,
                    textAlign: 'left',
                  }}
                >
                  {lang === 'zh' ? '中文' : 'English'}
                  {language === lang && <span style={{ color: isDark ? '#e8d5a3' : '#2e6fa0' }}>✓</span>}
                </button>
              ))}

              {/* Font size */}
              <div style={{ borderTop: `1px solid ${dropdownBorder}`, margin: '4px 0' }} />
              <div style={{ padding: '8px 16px 4px', fontSize: '11px', color: textSecondary, fontWeight: 600, letterSpacing: '0.05em' }}>
                字号大小设置
              </div>
              <div style={{ borderBottom: `1px solid ${dropdownBorder}`, marginBottom: '4px' }} />
              <div style={{ display: 'flex', padding: '8px 16px', gap: '8px' }}>
                {FONT_SIZE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      border: `1px solid ${fontSize === opt.value ? (isDark ? '#e8d5a3' : '#2e6fa0') : dropdownBorder}`,
                      borderRadius: '6px',
                      background: fontSize === opt.value ? (isDark ? 'rgba(232,213,163,0.15)' : 'rgba(74,127,165,0.1)') : 'none',
                      cursor: 'pointer',
                      color: fontSize === opt.value ? (isDark ? '#e8d5a3' : '#2e6fa0') : (isDark ? '#c0d0e0' : '#444'),
                      fontSize: '13px',
                      fontWeight: fontSize === opt.value ? 700 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Theme */}
              <div style={{ borderTop: `1px solid ${dropdownBorder}`, margin: '4px 0' }} />
              <div style={{ padding: '8px 16px 4px', fontSize: '11px', color: textSecondary, fontWeight: 600, letterSpacing: '0.05em' }}>
                风格切换
              </div>
              <div style={{ borderBottom: `1px solid ${dropdownBorder}`, marginBottom: '4px' }} />
              {([{ value: 'dark' as VT, label: '风格1（夜间深色）' }, { value: 'light' as VT, label: '风格2（日间浅色）' }]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setTheme(opt.value); setShowSettings(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 16px',
                    background: theme === opt.value ? (isDark ? 'rgba(232,213,163,0.1)' : 'rgba(74,127,165,0.08)') : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme === opt.value ? (isDark ? '#e8d5a3' : '#2e6fa0') : (isDark ? '#c0d0e0' : '#444'),
                    fontSize: '14px',
                    fontWeight: theme === opt.value ? 600 : 400,
                    textAlign: 'left',
                  }}
                >
                  {opt.label}
                  {theme === opt.value && <span style={{ color: isDark ? '#e8d5a3' : '#2e6fa0' }}>✓</span>}
                </button>
              ))}

              {/* About */}
              <div style={{ borderTop: `1px solid ${dropdownBorder}`, margin: '4px 0' }} />
              <button
                onClick={() => { setShowAbout(true); setShowSettings(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDark ? '#c0d0e0' : '#444',
                  fontSize: '14px',
                  textAlign: 'left',
                }}
              >
                关于韦达书库
              </button>
            </div>
          )}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: textPrimary,
            fontFamily: "'Noto Serif SC', serif",
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <img
            src={CDN.APP_ICON}
            alt="韦达书库"
            style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
          />
          韦达书库
        </h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Books list */}
      <div style={{ padding: '16px' }}>
        <div style={{ color: textSecondary, fontSize: '0.85rem', marginBottom: '12px', fontWeight: 500 }}>
          书架
        </div>
        {books.map(book => (
          <div
            key={book.id}
            onClick={() => onSelectBook(book.id)}
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '10px',
              marginBottom: '12px',
              overflow: 'hidden',
              boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(74,127,165,0.1)',
              cursor: 'pointer',
              display: 'flex',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 16px rgba(74,127,165,0.18)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(74,127,165,0.1)';
            }}
          >
            {/* Cover image */}
            <div style={{ width: '80px', minHeight: '100px', flexShrink: 0, overflow: 'hidden' }}>
              <img
                src={book.cover}
                alt={book.zhName}
                style={{ width: '80px', height: '100%', minHeight: '100px', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* Info */}
            <div style={{ padding: '14px 16px', flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary, marginBottom: '4px', fontFamily: "'Noto Serif SC', serif" }}>
                {book.zhName}
              </div>
              <div style={{ fontSize: '0.8rem', color: isDark ? '#c0a060' : '#6a8aa0', marginBottom: '6px', fontStyle: 'italic', fontFamily: "'Gentium Book Plus', serif" }}>
                {book.enName}
              </div>
              <div style={{ fontSize: '0.78rem', color: textSecondary, lineHeight: 1.5 }}>
                {book.description}
              </div>
            </div>
            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px', color: isDark ? '#4a6a8a' : '#b0c8dc' }}>
              <ChevronRight size={16} />
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', color: textSecondary, fontSize: '13px', marginTop: '8px' }}>
          已经加载到最后
        </div>
      </div>

      <AboutDialog open={showAbout} onClose={() => setShowAbout(false)} theme={theme} />
    </div>
  );
}
