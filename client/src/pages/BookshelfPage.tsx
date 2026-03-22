// BookshelfPage — 书架主页
// Design: 支持风格1（夜间深色）和风格2（浅色），左上角齿轮设置下拉菜单
import React, { useState, useRef, useEffect } from 'react';
import { Settings, ChevronDown, ChevronRight } from 'lucide-react';
import AboutDialog from '../components/AboutDialog';
import type { Language, FontSize, VedaTheme } from '../types';
import { CDN } from '../constants';
import type { VedaTheme as VT } from '../hooks/useSettings';
import { toast } from 'sonner';
import { preloadBGData, preloadSBIndex } from '../hooks/useData';

interface BookshelfPageProps {
  onSelectBook: (bookId: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  theme: VT;
  setTheme: (t: VT) => void;
}

const FONT_SIZE_OPTIONS: { value: FontSize; label_zh: string; label_en: string }[] = [
  { value: 'sm', label_zh: '小', label_en: 'S' },
  { value: 'md', label_zh: '中', label_en: 'M' },
  { value: 'lg', label_zh: '大', label_en: 'L' },
  { value: 'xl', label_zh: '特大', label_en: 'XL' },
];

const books = [
  {
    id: 'bg',
    zhName: '博伽梵歌原义',
    enName: 'Bhagavad-gītā As It Is',
    description_zh: '18章657节，含梵文原文、逐词释义、译文及要旨',
    description_en: '18 chapters, 657 verses. Sanskrit, word-for-word, translation & purport.',
    cover: CDN.COVER_BG,
  },
  {
    id: 'sb',
    zhName: '圣典博伽瓦谭',
    enName: 'Śrīmad-Bhāgavatam',
    description_zh: '12篇336章13002节，含中英双语',
    description_en: '12 cantos, 336 chapters, 13002 verses. Bilingual.',
    cover: CDN.COVER_SB,
  },
  {
    id: 'akadasi',
    zhName: '爱卡达西',
    enName: 'Ekādaśī',
    description_zh: '101章，爱卡达西斋戒日的故事与规范',
    description_en: '101 chapters. Stories and rules for Ekādaśī fasting days.',
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
  const isEn = language === 'en';
  const bg = isDark ? '#0f1923' : '#f5f7fa';
  const navBg = isDark ? '#1a2535' : '#ffffff';
  const navBorder = isDark ? '#2a3a50' : '#e0eaf2';
  const textPrimary = isDark ? '#e8d5a3' : '#1a3a5c';
  const textSecondary = isDark ? '#8aa0b4' : '#6a8aa0';
  const cardBg = isDark ? '#1a2535' : '#ffffff';
  const cardBorder = isDark ? '#2a3a50' : 'transparent';
  const dropdownBg = isDark ? '#1e2e42' : '#ffffff';
  const dropdownBorder = isDark ? '#2a3a50' : '#e0eaf2';
  const activeColor = isDark ? '#e8d5a3' : '#2e6fa0';
  const activeBg = isDark ? 'rgba(232,213,163,0.1)' : 'rgba(74,127,165,0.08)';

  // 书架页加载时，地山火源预加载主要数据文件
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadBGData();
      preloadSBIndex();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    setShowSettings(false);
    const msg = lang === 'zh'
      ? '已切换为中文 / Switched to Chinese'
      : '已切换为英文 / Switched to English';
    toast.success(msg, { duration: 2000 });
  };

  const handleSetFontSize = (size: FontSize) => {
    setFontSize(size);
    const labels: Record<FontSize, string> = { sm: isEn ? 'Small' : '小', md: isEn ? 'Medium' : '中', lg: isEn ? 'Large' : '大', xl: isEn ? 'Extra Large' : '特大' };
    toast.success(isEn ? `Font size: ${labels[size]}` : `字号已设为：${labels[size]}`, { duration: 1500 });
  };

  const handleSetTheme = (t: VT) => {
    setTheme(t);
    setShowSettings(false);
    const msg = t === 'dark'
      ? (isEn ? 'Dark mode on / 夜间深色' : '已切换为夜间深色')
      : (isEn ? 'Light mode on / 日间浅色' : '已切换为日间浅色');
    toast.success(msg, { duration: 1500 });
  };

  const fontSizeLabel = (size: FontSize) => {
    const opt = FONT_SIZE_OPTIONS.find(o => o.value === size);
    return isEn ? opt?.label_en : opt?.label_zh;
  };

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
              background: showSettings ? activeBg : 'none',
              border: 'none',
              cursor: 'pointer',
              color: showSettings ? activeColor : textSecondary,
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              borderRadius: '6px',
              transition: 'background 0.15s, color 0.15s',
            }}
            title={isEn ? 'Settings' : '设置'}
          >
            <Settings size={20} />
            <ChevronDown size={14} style={{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
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
                minWidth: '220px',
                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 200,
              }}
            >
              {/* Language */}
              <div style={{ padding: '8px 16px 4px', fontSize: '11px', color: textSecondary, fontWeight: 600, letterSpacing: '0.05em' }}>
                语言 / Language
              </div>
              <div style={{ borderBottom: `1px solid ${dropdownBorder}`, marginBottom: '4px' }} />
              {(['zh', 'en'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => handleSetLanguage(lang)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 16px',
                    background: language === lang ? activeBg : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: language === lang ? activeColor : (isDark ? '#c0d0e0' : '#444'),
                    fontSize: '14px',
                    fontWeight: language === lang ? 600 : 400,
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                >
                  <span>{lang === 'zh' ? '中文 / Chinese' : 'English / 英文'}</span>
                  {language === lang && <span style={{ color: activeColor }}>✓</span>}
                </button>
              ))}

              {/* Font size */}
              <div style={{ borderTop: `1px solid ${dropdownBorder}`, margin: '4px 0' }} />
              <div style={{ padding: '8px 16px 4px', fontSize: '11px', color: textSecondary, fontWeight: 600, letterSpacing: '0.05em' }}>
                字号 / Font Size
              </div>
              <div style={{ borderBottom: `1px solid ${dropdownBorder}`, marginBottom: '4px' }} />
              <div style={{ display: 'flex', padding: '8px 16px', gap: '8px' }}>
                {FONT_SIZE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSetFontSize(opt.value)}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      border: `1.5px solid ${fontSize === opt.value ? activeColor : dropdownBorder}`,
                      borderRadius: '6px',
                      background: fontSize === opt.value ? activeBg : 'none',
                      cursor: 'pointer',
                      color: fontSize === opt.value ? activeColor : (isDark ? '#c0d0e0' : '#444'),
                      fontSize: '13px',
                      fontWeight: fontSize === opt.value ? 700 : 400,
                      transition: 'all 0.1s',
                    }}
                  >
                    <div>{isEn ? opt.label_en : opt.label_zh}</div>
                    <div style={{ fontSize: '10px', opacity: 0.6 }}>{isEn ? opt.label_zh : opt.label_en}</div>
                  </button>
                ))}
              </div>

              {/* Theme */}
              <div style={{ borderTop: `1px solid ${dropdownBorder}`, margin: '4px 0' }} />
              <div style={{ padding: '8px 16px 4px', fontSize: '11px', color: textSecondary, fontWeight: 600, letterSpacing: '0.05em' }}>
                风格 / Theme
              </div>
              <div style={{ borderBottom: `1px solid ${dropdownBorder}`, marginBottom: '4px' }} />
              {([
                { value: 'dark' as VT, label_zh: '夜间深色', label_en: 'Dark Mode' },
                { value: 'light' as VT, label_zh: '日间浅色', label_en: 'Light Mode' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSetTheme(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 16px',
                    background: theme === opt.value ? activeBg : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme === opt.value ? activeColor : (isDark ? '#c0d0e0' : '#444'),
                    fontSize: '14px',
                    fontWeight: theme === opt.value ? 600 : 400,
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                >
                  <span>{isEn ? `${opt.label_en} / ${opt.label_zh}` : `${opt.label_zh} / ${opt.label_en}`}</span>
                  {theme === opt.value && <span style={{ color: activeColor }}>✓</span>}
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
                  transition: 'background 0.1s',
                }}
              >
                {isEn ? 'About / 关于韦达书库' : '关于韦达书库 / About'}
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
          {isEn ? 'Veda Library' : '韦达书库'}
        </h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Books list */}
      <div style={{ padding: '16px' }}>
        <div style={{ color: textSecondary, fontSize: '0.85rem', marginBottom: '12px', fontWeight: 500 }}>
          {isEn ? 'Bookshelf / 书架' : '书架'}
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
              {/* 中英标题：根据语言决定主次顺序 */}
              <div style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary, marginBottom: '2px', fontFamily: "'Noto Serif SC', serif" }}>
                {isEn ? book.enName : book.zhName}
              </div>
              <div style={{ fontSize: '0.8rem', color: isDark ? '#c0a060' : '#6a8aa0', marginBottom: '6px', fontStyle: 'italic', fontFamily: "'Gentium Book Plus', serif" }}>
                {isEn ? book.zhName : book.enName}
              </div>
              <div style={{ fontSize: '0.78rem', color: textSecondary, lineHeight: 1.5 }}>
                {isEn ? book.description_en : book.description_zh}
              </div>
            </div>
            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px', color: isDark ? '#4a6a8a' : '#b0c8dc' }}>
              <ChevronRight size={16} />
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', color: textSecondary, fontSize: '13px', marginTop: '8px' }}>
          {isEn ? 'End of list' : '已经加载到最后'}
        </div>
      </div>

      <AboutDialog open={showAbout} onClose={() => setShowAbout(false)} theme={theme} language={language} />
    </div>
  );
}
