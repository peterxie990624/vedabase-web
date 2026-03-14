import React from 'react';
import { X } from 'lucide-react';
import type { VedaTheme } from '../types';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
  theme?: VedaTheme;
}

export default function AboutDialog({ open, onClose, theme = 'light' }: AboutDialogProps) {
  if (!open) return null;
  const isDark = theme === 'dark';
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
          关于韦达书库
        </h2>

        <p style={{ color: textColor, lineHeight: 1.7, fontSize: '14px' }}>
          韦达书库网页版是韦达书库安卓APP的网页版本，旨在让苹果手机用户及不便安装APP的用户也能方便地阅读韦达经典。
        </p>

        <h3 style={{ color: subheadingColor, fontSize: '1rem', marginTop: '20px' }}>
          内容来源
        </h3>
        <p style={{ color: textColor, lineHeight: 1.7, fontSize: '14px' }}>
          本网站所有经典内容（包括薄伽梵歌、圣典博伽瓦谭、爱卡达西、韦达日历）均来源于：
        </p>
        <ul style={{ color: textColor, lineHeight: 2, fontSize: '14px', paddingLeft: '20px' }}>
          <li>
            <strong>韦达书库安卓APP</strong>（vedabooks.net）
            — 原始数据库，包含中英双语经典内容及韦达日历
          </li>
        </ul>

        <h3 style={{ color: subheadingColor, fontSize: '1rem', marginTop: '20px' }}>
          参考资源
        </h3>
        <p style={{ color: textColor, lineHeight: 1.7, fontSize: '14px' }}>
          网站界面风格参考了：
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
            — 国际韦达文献在线图书馆（界面风格参考）
          </li>
        </ul>

        <h3 style={{ color: subheadingColor, fontSize: '1rem', marginTop: '20px' }}>
          翻译说明
        </h3>
        <p style={{ color: textColor, lineHeight: 1.7, fontSize: '14px' }}>
          所有中英文翻译均来自韦达书库APP原版内容，由专业译者翻译，本网站未对任何内容进行修改或自行翻译。
        </p>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${borderColor}`, textAlign: 'center', color: isDark ? '#4a6a8a' : '#8aa0b4', fontSize: '12px' }}>
          韦达书库网页版 · 版权归原作者所有
        </div>
      </div>
    </div>
  );
}
