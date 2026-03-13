import { useState, useCallback } from 'react';
import type { Language, FontSize } from '../types';

const LANG_KEY = 'vedabase_language';
const FONT_KEY = 'vedabase_fontsize';

export function useSettings() {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(LANG_KEY) as Language) || 'zh';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem(FONT_KEY) as FontSize) || 'md';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_KEY, lang);
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(FONT_KEY, size);
  }, []);

  const fontSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[fontSize];

  const fontSizePx = {
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
  }[fontSize];

  return { language, setLanguage, fontSize, setFontSize, fontSizeClass, fontSizePx };
}
