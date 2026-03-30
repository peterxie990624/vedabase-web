import React from 'react';
import { Trash2 } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import type { Bookmark, VedaTheme } from '../types';
import { CDN } from '../constants';

interface BookmarksPageProps {
  onOpenBookmark: (bookmark: Bookmark) => void;
  theme?: VedaTheme;
  language?: 'zh' | 'en';
}

const bookTypeLabel: Record<string, string> = {
  bg: '博伽梵歌',
  sb: '博伽瓦谭',
  akadasi: '爱卡达西',
};

const bookTypeCoverImg: Record<string, string> = {
  bg: CDN.COVER_BG,
  sb: CDN.COVER_SB,
  akadasi: CDN.COVER_EKADASI,
};

export default function BookmarksPage({ onOpenBookmark, theme = 'light', language = 'zh' }: BookmarksPageProps) {
  const { bookmarks, removeBookmark } = useBookmarks();
  const isDark = theme === 'dark';

  // 直接使用保存的中英文title和preview，无需动态生成
  const displayBookmarks = bookmarks.map(bookmark => ({
    ...bookmark,
    displayTitle: language === 'zh' ? bookmark.title_zh : bookmark.title_en,
    displayPreview: language === 'zh' ? bookmark.preview_zh : bookmark.preview_en,
  }));

  const navBg = isDark ? '#1a2535' : 'white';
  const navBorder = isDark ? '#2a3a50' : 'var(--veda-border)';
  const navColor = isDark ? '#c8a84b' : 'var(--veda-blue)';
  const pageBg = isDark ? '#0f1923' : 'var(--veda-bg)';
  const listBg = isDark ? '#141e2c' : 'white';
  const itemBorder = isDark ? '#1e2e42' : 'var(--veda-border)';
  const titleColor = isDark ? '#d8d0b8' : 'var(--veda-text)';
  const previewColor = isDark ? '#7a9ab8' : '#6a8aa0';
  const bookLabelColor = isDark ? '#4a6a88' : '#b0c8dc';
  const hoverBg = isDark ? '#1e2e42' : 'var(--veda-blue-light)';
  const footerColor = isDark ? '#3a5070' : '#b0c8dc';
  const deleteColor = isDark ? '#3a5070' : '#c8d8e4';

  return (
    <div
      style={{
        paddingTop: '56px',
        paddingBottom: '60px',
        minHeight: '100vh',
        background: pageBg,
      }}
    >
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
          justifyContent: 'center',
          padding: '0 16px',
          zIndex: 100,
          boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(74,127,165,0.08)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: navColor,
          }}
        >
          书签
        </h1>
      </div>

      {bookmarks.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            color: isDark ? '#3a5070' : '#b0c8dc',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔖</div>
          <div style={{ fontSize: '0.9rem' }}>暂无书签</div>
          <div style={{ fontSize: '0.8rem', marginTop: '6px', color: isDark ? '#2a4060' : '#c8d8e4' }}>
            在阅读页面点击书签图标添加
          </div>
        </div>
      ) : (
        <div style={{ background: listBg }}>
          {displayBookmarks.map((bookmark, idx) => (
            <div
              key={`${bookmark.bookType}-${bookmark.chapterId}-${bookmark.sectionId}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: `1px solid ${itemBorder}`,
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: listBg,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = hoverBg}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = listBg}
              onClick={() => onOpenBookmark(bookmark)}
            >
              {/* Cover image */}
              <div
                style={{
                  width: '52px',
                  height: '64px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  marginRight: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                <img
                  src={bookTypeCoverImg[bookmark.bookType]}
                  alt={bookTypeLabel[bookmark.bookType]}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {/* Content */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: titleColor,
                    marginBottom: '4px',
                  }}
                >
                  {bookmark.displayTitle}
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: previewColor,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bookmark.displayPreview}
                </div>
                <div style={{ fontSize: '0.75rem', color: bookLabelColor, marginTop: '4px' }}>
                  {bookTypeLabel[bookmark.bookType]}
                  {language === 'en' && <span style={{ marginLeft: '8px', fontSize: '0.7rem', opacity: 0.7 }}>(中文版本)</span>}
                </div>
              </div>
              {/* Delete */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (window.confirm(`确认删除书签「${bookmark.displayTitle}」？`)) {
                    removeBookmark(bookmark.bookType, bookmark.chapterId, bookmark.sectionId);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: deleteColor,
                  padding: '8px',
                  flexShrink: 0,
                }}
                title="删除书签"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div style={{ padding: '16px', textAlign: 'center', color: footerColor, fontSize: '13px' }}>
            已经加载到最后
          </div>
        </div>
      )}
    </div>
  );
}
