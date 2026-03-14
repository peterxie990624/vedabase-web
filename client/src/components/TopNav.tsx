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
  // All colors are now driven by CSS variables (--veda-nav-*) set via data-veda-theme on <html>
  // This ensures the nav bar responds to theme changes even when theme prop is not passed

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: 'var(--veda-nav-color)',
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
              color: 'var(--veda-nav-color)',
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
              color: hasPrev ? 'var(--veda-nav-color)' : 'var(--veda-nav-disabled)',
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
          color: 'var(--veda-nav-color)',
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
              color: hasNext ? 'var(--veda-nav-color)' : 'var(--veda-nav-disabled)',
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
              color: 'var(--veda-nav-color)',
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
              border: '1px solid var(--veda-nav-color)',
              cursor: 'pointer',
              padding: '3px 8px',
              color: 'var(--veda-nav-color)',
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
              color: isBookmarked ? 'var(--veda-nav-color)' : 'var(--veda-nav-inactive)',
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
