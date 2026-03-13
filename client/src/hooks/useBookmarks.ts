import { useState, useCallback } from 'react';
import type { Bookmark } from '../types';

const STORAGE_KEY = 'vedabase_bookmarks';

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
      const newBookmarks = [{ ...bookmark, timestamp: Date.now() }, ...prev];
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
