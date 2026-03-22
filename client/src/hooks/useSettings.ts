import { useState, useCallback, useEffect } from 'react';
import type { Language, FontSize } from '../types';

const LANG_KEY = 'vedabase_language';
const FONT_KEY = 'vedabase_fontsize';
const THEME_KEY = 'vedabase_theme';

export type VedaTheme = 'light' | 'dark';

export function useSettings() {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(LANG_KEY) as Language) || 'zh';
  });
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem(FONT_KEY) as FontSize) || 'md';
  });
  const [theme, setThemeState] = useState<VedaTheme>(() => {
    return (localStorage.getItem(THEME_KEY) as VedaTheme) || 'dark';
  });

  // Sync theme to html attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-veda-theme', theme);
  }, [theme]);

  // Sync font size to CSS variable and html attribute for global UI scaling
  useEffect(() => {
    const uiFontSizePx: Record<FontSize, number> = { sm: 13, md: 15, lg: 17, xl: 19 };
    document.documentElement.setAttribute('data-veda-fontsize', fontSize);
    document.documentElement.style.setProperty('--veda-ui-font-size', `${uiFontSizePx[fontSize]}px`);
  }, [fontSize]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_KEY, lang);
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(FONT_KEY, size);
  }, []);

  const setTheme = useCallback((t: VedaTheme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.setAttribute('data-veda-theme', t);
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

  return { language, setLanguage, fontSize, setFontSize, fontSizeClass, fontSizePx, theme, setTheme };
}
