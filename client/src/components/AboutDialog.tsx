import React from 'react';
import { X } from 'lucide-react';
import type { VedaTheme, Language } from '../types';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
  theme?: VedaTheme;
  language?: Language;
}

export default function AboutDialog({ open, onClose, theme = 'light', language = 'zh' }: AboutDialogProps) {
  if (!open) return null;
  const isDark = theme === 'dark';
  const isEn = language === 'en';
  const bg = isDark ? '#1a2535' : 'white';
  const textColor = isDark ? '#c0d0e0' : '#444';
  const headingColor = isDark ? '#e8d5a3' : '#1a3a5c';
  const subheadingColor = isDark ? '#c0a060' : '#2e6fa0';
  const borderColor = isDark ? '#2a3a50' : '#e0eaf2';
  const linkColor = isDark ? '#6aacdc' : '#2e6fa0';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: bg,
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
          border: isDark ? `1px solid ${borderColor}` : 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#8aa0b4',
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ color: headingColor, marginTop: 0, fontSize: '1.2rem', fontFamily: "'Noto Serif SC', serif" }}>
          {isEn ? 'About Veda Library / 关于韦达书库' : '关于韦达书库'}
        </h2>

        <p style={{ color: textColor, lineHeight: 1.7, fontSize: '14px' }}>
          {isEn
            ? 'Veda Library Web is the web version of the Veda Library Android App, designed to help Apple users and those who cannot install the app to read Vedic scriptures conveniently.'
            : '韦达书库网页版是韦达书库安卓APP的网页版本，旨在让苹果手机用户及不便安装APP的用户也能方便地阅读韦达经典。'}
        </p>

        <h3 style={{ color: subheadingColor, fontSize: '1rem', marginTop: '20px' }}>
          {isEn ? 'Content Sources / 内容来源' : '内容来源'}
        </h3>
        <p style={{ color: textColor, lineHeight: 1.7, fontSize: '14px' }}>
          {isEn
            ? 'All scripture content (Bhagavad-gītā, Śrīmad-Bhāgavatam, Ekādaśī, Vedic Calendar) is sourced from:'
            : '本网站所有经典内容（包括薄伽梵歌、圣典博伽瓦谭、爱卡达西、韦达日历）均来源于：'}
        </p>
        <ul style={{ color: textColor, lineHeight: 2, fontSize: '14px', paddingLeft: '20px' }}>
          <li>
            <strong>{isEn ? 'Veda Library Android App' : '韦达书库安卓APP'}</strong>（vedabooks.net）
            {isEn
              ? ' — Original database with bilingual scripture content and Vedic calendar'
              : ' — 原始数据库，包含中英双语经典内容及韦达日历'}
          </li>
        </ul>

        <h3 style={{ color: subheadingColor, fontSize: '1rem', marginTop: '20px' }}>
          {isEn ? 'References / 参考资源' : '参考资源'}
        </h3>
        <p style={{ color: textColor, lineHeight: 1.7, fontSize: '14px' }}>
          {isEn ? 'The interface design references:' : '网站界面风格参考了：'}
        </p>
        <ul style={{ color: textColor, lineHeight: 2, fontSize: '14px', paddingLeft: '20px' }}>
          <li>
            <a
              href="https://vedabase.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: linkColor, textDecoration: 'underline' }}
            >
              vedabase.io
            </a>
            {isEn
              ? ' — International Vedic Literature Online Library (UI reference)'
              : ' — 国际韦达文献在线图书馆（界面风格参考）'}
          </li>
        </ul>

        <h3 style={{ color: subheadingColor, fontSize: '1rem', marginTop: '20px' }}>
          {isEn ? 'Translation Notes / 翻译说明' : '翻译说明'}
        </h3>
        <p style={{ color: textColor, lineHeight: 1.7, fontSize: '14px' }}>
          {isEn ? (
            <>
              All <strong>scripture content</strong> (translations, purports, word-for-word) is directly from the Veda Library App, translated by professional translators. The app has not modified any scripture content.
              <br /><br />
              <strong>Interface text</strong> (navigation labels, settings, buttons, etc.) outside of scripture content has been translated by AI (this app's developer) and may differ from official translations.
            </>
          ) : (
            <>
              所有<strong>经典内容</strong>（译文、要旨、逐词释义等）均直接来自韦达书库APP原版内容，由专业译者翻译，本网站未对任何经典内容进行修改。
              <br /><br />
              <strong>界面文字</strong>（导航标签、设置菜单、按钮等非经典内容）的英文翻译由本应用开发者（AI辅助）自行翻译，可能与官方翻译有所不同。
            </>
          )}
        </p>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${borderColor}`, textAlign: 'center', color: isDark ? '#4a6a8a' : '#8aa0b4', fontSize: '12px' }}>
          {isEn ? 'Veda Library Web · All rights reserved to original authors' : '韦达书库网页版 · 版权归原作者所有'}
        </div>
      </div>
    </div>
  );
}
