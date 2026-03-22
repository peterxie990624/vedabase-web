import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Home, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Settings, List } from 'lucide-react';
import type { Language, FontSize, VedaTheme } from '../types';
import { toast } from 'sonner';

interface TopNavProps {
  title?: string;
  onBack?: () => void;
  onHome?: () => void;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  showNavigation?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  language?: Language;
  onLanguageToggle?: () => void;
  fontSize?: FontSize;
  onFontSize?: (size: FontSize) => void;
  showSettings?: boolean;
  theme?: VedaTheme;
  // TOC (目录) support
  onToc?: () => void;
  // Chapter title for TOC button label
  chapterTitle?: string;
}

const FONT_SIZE_OPTIONS: { value: FontSize; label_zh: string; label_en: string }[] = [
  { value: 'sm', label_zh: '小', label_en: 'S' },
  { value: 'md', label_zh: '中', label_en: 'M' },
  { value: 'lg', label_zh: '大', label_en: 'L' },
  { value: 'xl', label_zh: '特大', label_en: 'XL' },
];

export default function TopNav({
  title,
  onBack,
  onHome,
  showBookmark,
  isBookmarked,
  onBookmark,
  showNavigation,
  onPrev,
  onNext,
  hasPrev = true,
  hasNext = true,
  language,
  onLanguageToggle,
  fontSize,
  onFontSize,
  theme = 'light',
  onToc,
  chapterTitle,
}: TopNavProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const activeColor = isDark ? '#e8d5a3' : '#2e6fa0';
  const activeBg = isDark ? 'rgba(232,213,163,0.12)' : 'rgba(46,111,160,0.1)';
  const dropdownBg = isDark ? '#1e2e42' : '#ffffff';
  const dropdownBorder = isDark ? '#2a3a50' : '#e0eaf2';
  const textMuted = isDark ? '#8aa0b4' : '#6a8aa0';
  const textNormal = isDark ? '#c0d0e0' : '#333';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageToggle = () => {
    if (!onLanguageToggle || !language) return;
    onLanguageToggle();
    setShowSettingsMenu(false);
    const next = language === 'zh' ? 'en' : 'zh';
    const msg = next === 'zh'
      ? '已切换为中文 / Switched to Chinese'
      : '已切换为英文 / Switched to English';
    toast.success(msg, { duration: 2000 });
  };

  const handleFontSize = (size: FontSize) => {
    if (!onFontSize) return;
    onFontSize(size);
    const labels: Record<FontSize, string> = { sm: isEn ? 'Small' : '小', md: isEn ? 'Medium' : '中', lg: isEn ? 'Large' : '大', xl: isEn ? 'Extra Large' : '特大' };
    toast.success(isEn ? `Font size: ${labels[size]}` : `字号已设为：${labels[size]}`, { duration: 1500 });
  };

  const handleBookmark = () => {
    if (!onBookmark) return;
    onBookmark();
    const wasBookmarked = isBookmarked;
    toast.success(wasBookmarked
      ? (isEn ? 'Bookmark removed / 已取消书签' : '已取消书签')
      : (isEn ? 'Bookmarked! / 已添加书签' : '已添加书签'), { duration: 1500 });
  };

  // Whether to show the settings dropdown (only when reading)
  const hasSettingsMenu = !!(onFontSize && fontSize && onLanguageToggle && language);

  return (
    <div
      className="top-nav"
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '640px',
        height: '56px',
        background: 'var(--veda-nav-bg)',
        borderBottom: '1px solid var(--veda-nav-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        zIndex: 100,
        boxShadow: 'var(--veda-nav-shadow)',
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: '80px' }}>
        {onBack && (
          <NavButton onClick={onBack} title={isEn ? 'Back' : '返回'} activeColor={activeColor} activeBg={activeBg}>
            <ArrowLeft size={22} />
          </NavButton>
        )}
        {onHome && (
          <NavButton onClick={onHome} title={isEn ? 'Home' : '主页'} activeColor={activeColor} activeBg={activeBg}>
            <Home size={20} />
          </NavButton>
        )}
        {showNavigation && (
          <NavButton
            onClick={onPrev}
            disabled={!hasPrev}
            title={isEn ? 'Previous' : '上一节'}
            activeColor={activeColor}
            activeBg={activeBg}
          >
            <ChevronLeft size={22} />
          </NavButton>
        )}
      </div>

      {/* Center title — clickable to open TOC if onToc provided */}
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '1rem',
          color: 'var(--veda-nav-color)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 8px',
          cursor: onToc ? 'pointer' : 'default',
          userSelect: 'none',
        }}
        onClick={onToc}
        title={onToc ? (isEn ? 'Open Table of Contents' : '打开目录') : undefined}
      >
        {title}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: '80px', justifyContent: 'flex-end' }}>
        {showNavigation && (
          <NavButton
            onClick={onNext}
            disabled={!hasNext}
            title={isEn ? 'Next' : '下一节'}
            activeColor={activeColor}
            activeBg={activeBg}
          >
            <ChevronRight size={22} />
          </NavButton>
        )}

        {/* TOC button */}
        {onToc && (
          <NavButton onClick={onToc} title={isEn ? 'Table of Contents' : '目录'} activeColor={activeColor} activeBg={activeBg}>
            <List size={20} />
          </NavButton>
        )}

        {/* Settings dropdown (font size + language + bookmark) */}
        {hasSettingsMenu && (
          <div ref={settingsRef} style={{ position: 'relative' }}>
            <NavButton
              onClick={() => setShowSettingsMenu(v => !v)}
              title={isEn ? 'Settings' : '设置'}
              activeColor={activeColor}
              activeBg={activeBg}
              active={showSettingsMenu}
            >
              <Settings size={18} />
            </NavButton>

            {showSettingsMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  background: dropdownBg,
                  border: `1px solid ${dropdownBorder}`,
                  borderRadius: '10px',
                  padding: '8px 0',
                  minWidth: '200px',
                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 200,
                }}
              >
                {/* Language toggle */}
                <div style={{ padding: '6px 14px 4px', fontSize: '11px', color: textMuted, fontWeight: 600, letterSpacing: '0.05em' }}>
                  {isEn ? 'Language / 语言' : '语言 / Language'}
                </div>
                <div style={{ borderBottom: `1px solid ${dropdownBorder}`, marginBottom: '2px' }} />
                <button
                  onClick={handleLanguageToggle}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: textNormal,
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = activeBg}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <span>
                    {language === 'zh'
                      ? '中文 → English'
                      : 'English → 中文'}
                  </span>
                  <span style={{ fontSize: '12px', color: activeColor, fontWeight: 600 }}>
                    {language === 'zh' ? 'EN' : '中'}
                  </span>
                </button>

                {/* Font size */}
                <div style={{ borderTop: `1px solid ${dropdownBorder}`, margin: '4px 0' }} />
                <div style={{ padding: '6px 14px 4px', fontSize: '11px', color: textMuted, fontWeight: 600, letterSpacing: '0.05em' }}>
                  {isEn ? 'Font Size / 字号' : '字号 / Font Size'}
                </div>
                <div style={{ borderBottom: `1px solid ${dropdownBorder}`, marginBottom: '4px' }} />
                <div style={{ display: 'flex', padding: '8px 14px', gap: '6px' }}>
                  {FONT_SIZE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleFontSize(opt.value)}
                      style={{
                        flex: 1,
                        padding: '6px 2px',
                        border: `1.5px solid ${fontSize === opt.value ? activeColor : dropdownBorder}`,
                        borderRadius: '6px',
                        background: fontSize === opt.value ? activeBg : 'none',
                        cursor: 'pointer',
                        color: fontSize === opt.value ? activeColor : textNormal,
                        fontSize: '13px',
                        fontWeight: fontSize === opt.value ? 700 : 400,
                        transition: 'all 0.1s',
                        lineHeight: 1.3,
                      }}
                    >
                      <div>{isEn ? opt.label_en : opt.label_zh}</div>
                      <div style={{ fontSize: '10px', opacity: 0.6 }}>{isEn ? opt.label_zh : opt.label_en}</div>
                    </button>
                  ))}
                </div>

                {/* Bookmark */}
                {showBookmark && (
                  <>
                    <div style={{ borderTop: `1px solid ${dropdownBorder}`, margin: '4px 0' }} />
                    <button
                      onClick={() => { handleBookmark(); setShowSettingsMenu(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '10px 14px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: isBookmarked ? activeColor : textNormal,
                        fontWeight: isBookmarked ? 600 : 400,
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = activeBg}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <span>
                        {isBookmarked
                          ? (isEn ? 'Remove Bookmark / 取消书签' : '取消书签 / Remove Bookmark')
                          : (isEn ? 'Add Bookmark / 添加书签' : '添加书签 / Add Bookmark')}
                      </span>
                      {isBookmarked ? <BookmarkCheck size={16} color={activeColor} /> : <Bookmark size={16} />}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Standalone bookmark (for non-reading pages) */}
        {showBookmark && !hasSettingsMenu && (
          <NavButton
            onClick={handleBookmark}
            title={isBookmarked ? (isEn ? 'Remove Bookmark' : '取消书签') : (isEn ? 'Add Bookmark' : '添加书签')}
            activeColor={activeColor}
            activeBg={activeBg}
            active={isBookmarked}
          >
            {isBookmarked ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
          </NavButton>
        )}
      </div>
    </div>
  );
}

// ── Reusable nav button with press feedback ──────────────────────────────────
interface NavButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  activeColor: string;
  activeBg: string;
  active?: boolean;
  children: React.ReactNode;
}

function NavButton({ onClick, disabled, title, activeColor, activeBg, active, children }: NavButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: pressed ? activeBg : (active ? activeBg : 'none'),
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '6px',
        color: disabled
          ? 'var(--veda-nav-disabled)'
          : (active || pressed ? activeColor : 'var(--veda-nav-color)'),
        display: 'flex',
        alignItems: 'center',
        borderRadius: '6px',
        transform: pressed ? 'scale(0.88)' : 'scale(1)',
        transition: 'transform 0.1s, background 0.1s, color 0.1s',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}
