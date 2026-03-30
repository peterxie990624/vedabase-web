// 韦达书库 数据类型定义

export interface BGChapter {
  id: number;
  zh_name: string;
  en_name: string;
  zh_title: string;
  en_title: string;
}

export interface BGSection {
  id: number;
  section_id: string | number;
  ldw_fd: string | null;   // 梵文原文
  ldw_fc: string | null;   // 词义（分号分隔）
  words_zh_fc: string | null; // 中文词义
  words_en_fc: string | null; // 英文词义
  yw_zh: string | null;    // 译文（中）
  yw_en: string | null;    // 译文（英）
  yz_zh: string | null;    // 要旨（中）
  yz_en: string | null;    // 要旨（英）
}

export interface BGData {
  chapters: BGChapter[];
  sections: Record<string, BGSection[]>;
}

export interface SBCanto {
  id: number;
  zh_name: string;
  en_name: string;
  zh_subtitle?: string;
  en_subtitle?: string;
}

export interface SBChapter {
  id: number;
  zh_name: string;
  en_name: string;
  zh_title: string | null;
  en_title: string | null;
  canto_id: number;
}

export interface SBSection {
  id: number;
  section_id: string;
  ldw: string | null;      // 梵文原文
  ldw_fc: string | null;   // 词义（分号分隔）
  words_zh_fc: string | null;
  words_en_fc: string | null;
  yw_zh: string | null;    // 译文（中）
  yw_en: string | null;    // 译文（英）
  yz_zh: string | null;    // 要旨（中）
  yz_en: string | null;    // 要旨（英）
}

export interface SBIndex {
  cantos: SBCanto[];
  chapters: SBChapter[];
}

export interface SBCantoData {
  sections: Record<string, SBSection[]>;
}

export interface AkadasiChapter {
  id: number;
  zh_name: string;
  en_name: string;
  pjsj: string | null;
  zh_gs: string | null;
  en_gs: string | null;
  sj: string | null;
}

export interface AkadasiData {
  chapters: AkadasiChapter[];
}

export interface CalendarEvent {
  date: string;
  name: string[];
  important: string;
  address: string;
}

export interface CalendarMonth {
  month: string;
  data: CalendarEvent[];
}

export interface CalendarData {
  state: string;
  data: CalendarMonth[];
}

export interface Bookmark {
  bookType: 'bg' | 'sb' | 'akadasi';
  chapterId: number;
  sectionId?: string | number;
  sectionIndex?: number;   // exact section index for precise navigation
  title: string;           // 保留用于向后兼容
  preview: string;         // 保留用于向后兼容
  title_zh: string;        // 中文标题
  preview_zh: string;      // 中文详情（纯文本，无HTML标签）
  title_en: string;        // 英文标题
  preview_en: string;      // 英文详情（纯文本，无HTML标签）
  timestamp: number;
}

export type Language = 'zh' | 'en';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type TabType = 'bookshelf' | 'bookmarks' | 'search' | 'calendar';
export type VedaTheme = 'light' | 'dark';
