import React from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import type { Bookmark } from '../types';

interface BookmarksPageProps {
  onOpenBookmark: (bookmark: Bookmark) => void;
}

const bookTypeLabel: Record<string, string> = {
  bg: '博伽梵歌',
  sb: '博伽瓦谭',
  akadasi: '爱卡达西',
};

const bookTypeCover: Record<string, string> = {
  bg: 'linear-gradient(135deg, #1a3a5c 0%, #4a9fd4 100%)',
  sb: 'linear-gradient(135deg, #3a1a5c 0%, #9a6ad4 100%)',
  akadasi: 'linear-gradient(135deg, #5c3a1a 0%, #d4a45a 100%)',
};

const bookTypeEmoji: Record<string, string> = {
  bg: '🌿',
  sb: '📜',
  akadasi: '🌸',
};

export default function BookmarksPage({ onOpenBookmark }: BookmarksPageProps) {
  const { bookmarks, removeBookmark } = useBookmarks();

  return (
    <div
      style={{
        paddingTop: '56px',
        paddingBottom: '60px',
        minHeight: '100vh',
        background: 'var(--veda-bg)',
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
          background: 'white',
          borderBottom: '1px solid var(--veda-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(74,127,165,0.08)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--veda-blue)',
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
            color: '#b0c8dc',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔖</div>
          <div style={{ fontSize: '0.9rem' }}>暂无书签</div>
          <div style={{ fontSize: '0.8rem', marginTop: '6px', color: '#c8d8e4' }}>
            在阅读页面点击书签图标添加
          </div>
        </div>
      ) : (
        <div style={{ background: 'white' }}>
          {bookmarks.map((bookmark, idx) => (
            <div
              key={`${bookmark.bookType}-${bookmark.chapterId}-${bookmark.sectionId}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--veda-border)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--veda-blue-light)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
              onClick={() => onOpenBookmark(bookmark)}
            >
              {/* Cover */}
              <div
                style={{
                  width: '52px',
                  height: '64px',
                  background: bookTypeCover[bookmark.bookType],
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginRight: '12px',
                  fontSize: '1.5rem',
                }}
              >
                {bookTypeEmoji[bookmark.bookType]}
              </div>
              {/* Content */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--veda-text)',
                    marginBottom: '4px',
                  }}
                >
                  {bookmark.title}
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#6a8aa0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bookmark.preview}...
                </div>
                <div style={{ fontSize: '0.75rem', color: '#b0c8dc', marginTop: '4px' }}>
                  {bookTypeLabel[bookmark.bookType]}
                </div>
              </div>
              {/* Delete */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  removeBookmark(bookmark.bookType, bookmark.chapterId, bookmark.sectionId);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#c8d8e4',
                  padding: '8px',
                  flexShrink: 0,
                }}
                title="删除书签"
              >
                <Trash2 size={16} />
              </button>
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
