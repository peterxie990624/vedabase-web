import { useState, useCallback } from 'react';
import type { Bookmark } from '../types';

const STORAGE_KEY = 'vedabase_bookmarks';

// 清理HTML标签，只保留纯文本
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')  // 移除所有HTML标签
    .replace(/&nbsp;/g, ' ')  // 替换非断行空格
    .replace(/&lt;/g, '<')    // 替换HTML实体
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: Bookmark[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks);

  const addBookmark = useCallback((bookmark: Omit<Bookmark, 'timestamp'>) => {
    setBookmarks(prev => {
      const exists = prev.find(b =>
        b.bookType === bookmark.bookType &&
        b.chapterId === bookmark.chapterId &&
        b.sectionId === bookmark.sectionId
      );
      if (exists) return prev;
      
      // 清理preview中的HTML标签
      const cleanedPreview_zh = stripHtmlTags(bookmark.preview_zh).substring(0, 50) + '...';
      const cleanedPreview_en = stripHtmlTags(bookmark.preview_en).substring(0, 50) + '...';
      
      const newBookmark = {
        ...bookmark,
        preview_zh: cleanedPreview_zh,
        preview_en: cleanedPreview_en,
        timestamp: Date.now()
      };
      
      const newBookmarks = [newBookmark, ...prev];
      saveBookmarks(newBookmarks);
      return newBookmarks;
    });
  }, []);

  const removeBookmark = useCallback((bookType: string, chapterId: number, sectionId?: string | number) => {
    setBookmarks(prev => {
      const newBookmarks = prev.filter(b =>
        !(b.bookType === bookType && b.chapterId === chapterId && b.sectionId === sectionId)
      );
      saveBookmarks(newBookmarks);
      return newBookmarks;
    });
  }, []);

  const isBookmarked = useCallback((bookType: string, chapterId: number, sectionId?: string | number) => {
    return bookmarks.some(b =>
      b.bookType === bookType && b.chapterId === chapterId && b.sectionId === sectionId
    );
  }, [bookmarks]);

  const toggleBookmark = useCallback((bookmark: Omit<Bookmark, 'timestamp'>) => {
    if (isBookmarked(bookmark.bookType, bookmark.chapterId, bookmark.sectionId)) {
      removeBookmark(bookmark.bookType, bookmark.chapterId, bookmark.sectionId);
    } else {
      addBookmark(bookmark);
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark };
}
