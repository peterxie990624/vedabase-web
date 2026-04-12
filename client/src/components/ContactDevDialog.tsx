import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { VedaTheme } from '../types';

interface ContactDevDialogProps {
  open: boolean;
  onClose: () => void;
  theme?: VedaTheme;
  language?: 'zh' | 'en';
}

export default function ContactDevDialog({
  open,
  onClose,
  theme = 'light',
  language = 'zh',
}: ContactDevDialogProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const cardBg = isDark ? '#0f1923' : '#ffffff';
  const textPrimary = isDark ? '#e8d5a3' : '#1a3a5c';
  const textSecondary = isDark ? '#8aa0b4' : '#6a8aa0';
  const borderColor = isDark ? '#2a3a50' : '#e0eaf2';
  const accentColor = isDark ? '#c8a84b' : '#4a7fa5';
  const loadingColor = isDark ? '#e8d5a3' : '#2e6fa0';

  useEffect(() => {
    if (!open) {
      setImageLoaded(false);
      setImageError(false);
      return;
    }

    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = '/vedabase-web/assets/wechat_qr.jpg';
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: cardBg,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '320px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: isDark
              ? '0 20px 60px rgba(0, 0, 0, 0.6)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${borderColor}`,
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: textSecondary,
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = textPrimary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}
          >
            <X size={20} />
          </button>

          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: textPrimary,
              paddingRight: '28px',
            }}
          >
            {isEn ? 'Contact Developer' : '联系开发者'}
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              padding: '12px',
              background: isDark ? 'rgba(232, 213, 163, 0.08)' : 'rgba(74, 127, 165, 0.08)',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: cardBg,
                fontSize: '20px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              ⭐
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>
                大星 Patrick
              </div>
              <div style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>
                {isEn ? 'Developer' : '开发者'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: textSecondary, marginBottom: '8px' }}>
              {isEn ? 'WeChat QR Code' : '微信二维码'}
            </div>
            <div
              style={{
                width: '200px',
                height: '200px',
                margin: '0 auto',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark ? '#0a1420' : '#f9fbfd',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {!imageLoaded && !imageError && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      border: `3px solid ${loadingColor}`,
                      borderTop: `3px solid transparent`,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <div style={{ fontSize: '12px', color: textSecondary }}>
                    {isEn ? 'Loading...' : '加载中...'}
                  </div>
                </div>
              )}
              {imageLoaded && (
                <img
                  src="/vedabase-web/assets/wechat_qr.jpg"
                  alt="WeChat QR Code"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {imageError && (
                <div style={{ fontSize: '12px', color: textSecondary, textAlign: 'center' }}>
                  {isEn ? 'Failed to load' : '加载失败'}
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6, marginBottom: '16px' }}>
            {isEn ? (
              <>
                <p style={{ margin: '0 0 8px 0' }}>
                  I am the developer of Vedabase Web: Patrick. If you have any e-book resources or spiritual teacher lectures, please contact me.
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  If you have any suggestions for improving Vedabase or ideas for cooperation, you can contact me through this QR code.
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 8px 0' }}>
                  我是韦达书库网页版的开发者：大星Patrick。如果您有任何电子版书籍的资源，或者灵性导师的讲课等资源，可以联系我。
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  如果您对韦达书库有任何改进的建议、合作的想法，可以通过这个二维码联系开发者。
                </p>
              </>
            )}
          </div>

          <div style={{ padding: '12px', background: isDark ? 'rgba(200, 168, 75, 0.08)' : 'rgba(74, 127, 165, 0.08)', borderRadius: '8px', fontSize: '13px', color: textSecondary, marginBottom: '16px' }}>
            <span style={{ fontWeight: 600 }}>Email:</span>
            <br />
            <span style={{ fontFamily: 'monospace', color: textPrimary }}>3431503934@qq.com</span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              background: accentColor,
              border: 'none',
              borderRadius: '8px',
              color: cardBg,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isEn ? 'Close' : '关闭'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
