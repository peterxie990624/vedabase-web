import React from 'react';
import { ArrowLeft, Home, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Language, FontSize, VedaTheme } from '../types';

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
  onFontSize?: () => void;
  showSettings?: boolean;
  theme?: VedaTheme;
}

const fontSizeLabels: Record<FontSize, string> = {
  sm: 'A-',
  md: 'A',
  lg: 'A+',
  xl: 'A++',
};

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
}: TopNavProps) {
  const isDark = theme === 'dark';
  const navBg = isDark ? '#1a2535' : 'white';
  const navBorder = isDark ? '#2a3a50' : 'var(--veda-border)';
  const navColor = isDark ? '#c8a84b' : 'var(--veda-blue)';
  const navShadow = isDark
    ? '0 1px 4px rgba(0,0,0,0.3)'
    : '0 1px 4px rgba(74,127,165,0.08)';

  return (
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
        padding: '0 12px',
        zIndex: 100,
        boxShadow: navShadow,
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: navColor,
              display: 'flex',
              alignItems: 'center',
            }}
            title="返回"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        {onHome && (
          <button
            onClick={onHome}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: navColor,
              display: 'flex',
              alignItems: 'center',
            }}
            title="主页"
          >
            <Home size={20} />
          </button>
        )}
        {showNavigation && (
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            style={{
              background: 'none',
              border: 'none',
              cursor: hasPrev ? 'pointer' : 'not-allowed',
              padding: '4px',
              color: hasPrev ? navColor : (isDark ? '#3a5070' : '#ccc'),
              display: 'flex',
              alignItems: 'center',
            }}
            title="上一节"
          >
            <ChevronLeft size={22} />
          </button>
        )}
      </div>

      {/* Center title */}
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '1rem',
          color: navColor,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 8px',
        }}
      >
        {title}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: '80px', justifyContent: 'flex-end' }}>
        {showNavigation && (
          <button
            onClick={onNext}
            disabled={!hasNext}
            style={{
              background: 'none',
              border: 'none',
              cursor: hasNext ? 'pointer' : 'not-allowed',
              padding: '4px',
              color: hasNext ? navColor : (isDark ? '#3a5070' : '#ccc'),
              display: 'flex',
              alignItems: 'center',
            }}
            title="下一节"
          >
            <ChevronRight size={22} />
          </button>
        )}
        {onFontSize && fontSize && (
          <button
            onClick={onFontSize}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: navColor,
              fontSize: '13px',
              fontWeight: 700,
              minWidth: '28px',
            }}
            title="字体大小"
          >
            {fontSizeLabels[fontSize]}
          </button>
        )}
        {onLanguageToggle && language && (
          <button
            onClick={onLanguageToggle}
            style={{
              background: 'none',
              border: `1px solid ${navColor}`,
              cursor: 'pointer',
              padding: '3px 8px',
              color: navColor,
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '4px',
            }}
            title="切换语言"
          >
            {language === 'zh' ? 'EN' : '中'}
          </button>
        )}
        {showBookmark && (
          <button
            onClick={onBookmark}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: isBookmarked ? navColor : (isDark ? '#5a7a9a' : '#8aa0b4'),
              display: 'flex',
              alignItems: 'center',
            }}
            title={isBookmarked ? '取消书签' : '添加书签'}
          >
            {isBookmarked ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
          </button>
        )}
      </div>
    </div>
  );
}
