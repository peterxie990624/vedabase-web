import React, { useState } from 'react';
import { Trash2, Edit2, Check } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import type { Bookmark, VedaTheme } from '../types';
import { CDN, formatSectionLabel } from '../constants';

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
  
  // 多选状态管理
  const [editMode, setEditMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(new Set());

  // 对于新书签，使用保存的中英文内容
  // 对于旧书签，使用formatSectionLabel生成title，preview使用保存的值
  const displayBookmarks = bookmarks.map(bookmark => {
    let displayTitle = '';
    let displayPreview = '';
    
    if (language === 'zh') {
      // 中文模式
      if (bookmark.title_zh) {
        // 新书签：使用保存的中文title
        displayTitle = bookmark.title_zh;
        displayPreview = bookmark.preview_zh || '';
      } else {
        // 旧书签：使用formatSectionLabel生成中文title
        displayTitle = formatSectionLabel(bookmark.bookType, bookmark.sectionId || '', 'zh');
        displayPreview = bookmark.preview || '';
      }
    } else {
      // 英文模式
      if (bookmark.title_en) {
        // 新书签：使用保存的英文title
        displayTitle = bookmark.title_en;
        displayPreview = bookmark.preview_en || '';
      } else {
        // 旧书签：使用formatSectionLabel生成英文title
        displayTitle = formatSectionLabel(bookmark.bookType, bookmark.sectionId || '', 'en');
        displayPreview = bookmark.preview || '';
      }
    }
    
    return {
      ...bookmark,
      displayTitle: displayTitle || '',
      displayPreview: displayPreview || '',
    };
  });

  // 切换单个书签的选中状态
  const toggleSelectForDelete = (idx: number) => {
    const newSet = new Set(selectedForDelete);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setSelectedForDelete(newSet);
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedForDelete.size === bookmarks.length) {
      setSelectedForDelete(new Set());
    } else {
      setSelectedForDelete(new Set(bookmarks.map((_, idx) => idx)));
    }
  };

  // 批量删除
  const handleDeleteSelected = () => {
    const selectedTitles = Array.from(selectedForDelete)
      .map(idx => displayBookmarks[idx]?.displayTitle)
      .filter(Boolean);
    
    if (window.confirm(`确认删除 ${selectedForDelete.size} 个书签？\n${selectedTitles.join('、')}`)) {
      // 按倒序删除，避免索引变化
      Array.from(selectedForDelete)
        .sort((a, b) => b - a)
        .forEach(idx => {
          const bookmark = bookmarks[idx];
          if (bookmark) {
            removeBookmark(bookmark.bookType, bookmark.chapterId, bookmark.sectionId);
          }
        });
      setSelectedForDelete(new Set());
      setEditMode(false);
    }
  };

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
  const selectedBg = isDark ? 'rgba(200,168,75,0.1)' : 'rgba(46,111,160,0.08)';
  const checkboxBorder = isDark ? '#4a6a8a' : '#c0d0e0';
  const checkboxActive = '#d4a017';

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
          justifyContent: 'space-between',
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

        {/* 编辑模式按钮组 */}
        {bookmarks.length > 0 && (
          editMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: navColor,
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '4px 8px',
                }}
              >
                {selectedForDelete.size === bookmarks.length ? '取消全选' : '全选'}
              </button>
              {selectedForDelete.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#e05050',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '4px 8px',
                  }}
                >
                  删除({selectedForDelete.size})
                </button>
              )}
              <button
                onClick={() => {
                  setEditMode(false);
                  setSelectedForDelete(new Set());
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: navColor,
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '4px 8px',
                }}
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: navColor,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="多选删除"
            >
              <Edit2 size={16} />
            </button>
          )
        )}
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
                cursor: editMode ? 'default' : 'pointer',
                transition: 'background 0.15s',
                background: editMode && selectedForDelete.has(idx) ? selectedBg : listBg,
              }}
              onMouseEnter={e => {
                if (!editMode || !selectedForDelete.has(idx)) {
                  (e.currentTarget as HTMLElement).style.background = editMode ? listBg : hoverBg;
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = editMode && selectedForDelete.has(idx) ? selectedBg : listBg;
              }}
              onClick={() => {
                if (editMode) {
                  toggleSelectForDelete(idx);
                } else {
                  onOpenBookmark(bookmark);
                }
              }}
            >
              {/* Checkbox (edit mode only) */}
              {editMode && (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${selectedForDelete.has(idx) ? checkboxActive : checkboxBorder}`,
                    background: selectedForDelete.has(idx) ? checkboxActive : 'transparent',
                    marginRight: '12px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedForDelete.has(idx) && <Check size={12} color="white" />}
                </div>
              )}

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

              {/* Delete button (non-edit mode only) */}
              {!editMode && (
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
              )}
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
