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
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const cardBg = isDark ? '#0f1923' : '#ffffff';
  const textPrimary = isDark ? '#e8d5a3' : '#1a3a5c';
  const textSecondary = isDark ? '#8aa0b4' : '#6a8aa0';
  const titleColor = isDark ? '#ffd700' : '#2e5fa0';
  const borderColor = isDark ? '#2a3a50' : '#e0eaf2';
  const accentColor = isDark ? '#c8a84b' : '#4a7fa5';
  const loadingColor = isDark ? '#e8d5a3' : '#2e6fa0';
  const lightBorder = isDark ? '#1e2e42' : '#f0f5fa';
  const heavyBorder = isDark ? '#3a4a60' : '#d0dae8';

  // 根据主题选择对应的二维码
  const qrSrc = isDark
    ? '/vedabase-web/assets/wechat_qr_dark.png'
    : '/vedabase-web/assets/wechat_qr_light.png';

  const avatarSrc = '/vedabase-web/assets/avatar_daxing.jpg';

  useEffect(() => {
    if (!open) {
      setQrLoaded(false);
      setQrError(false);
      setAvatarLoaded(false);
      return;
    }

    // 预加载二维码
    const qrImg = new window.Image();
    qrImg.onload = () => setQrLoaded(true);
    qrImg.onerror = () => setQrError(true);
    qrImg.src = qrSrc;

    // 预加载头像
    const avatarImg = new window.Image();
    avatarImg.onload = () => setAvatarLoaded(true);
    avatarImg.src = avatarSrc;
  }, [open, qrSrc]);

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
            maxWidth: '340px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: isDark
              ? '0 20px 60px rgba(0, 0, 0, 0.6)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${borderColor}`,
            position: 'relative',
          }}
        >
          {/* 关闭按钮 */}
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

          {/* 标题 */}
          <h2
            style={{
              margin: '0 0 20px 0',
              fontSize: '24px',
              fontWeight: 700,
              color: titleColor,
              paddingRight: '28px',
            }}
          >
            {isEn ? 'Contact Developer' : '联系开发者'}
          </h2>

          {/* 第一部分：开发者信息 */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {/* 大星头像 */}
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: '#f9a8b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatarLoaded ? (
                  <img
                    src={avatarSrc}
                    alt="大星 Patrick"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '22px' }}>⭐</span>
                )}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
                  大星 Patrick
                </div>
                <div style={{ fontSize: '12px', color: textSecondary, marginTop: '3px' }}>
                  {isEn ? 'Developer' : '开发者'}
                </div>
              </div>
            </div>
          </div>

          {/* 第一部分与第二部分的分隔线（细） */}
          <div style={{ height: '1px', background: lightBorder, margin: '12px 0' }} />

          {/* 第二部分：微信二维码 */}
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginBottom: '12px' }}>
              {isEn ? 'WeChat QR Code · Long press to add friend' : '微信二维码 长按添加好友'}
            </div>
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                maxWidth: '220px',
                margin: '0 auto',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {!qrLoaded && !qrError && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
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
              {qrLoaded && (
                <img
                  src={qrSrc}
                  alt="WeChat QR Code"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {qrError && (
                <div style={{ fontSize: '13px', color: textSecondary, textAlign: 'center', padding: '20px' }}>
                  {isEn ? 'Failed to load image' : '图片加载失败'}
                </div>
              )}
            </div>
          </div>

          {/* 第二部分与第三部分的分隔线（细） */}
          <div style={{ height: '1px', background: lightBorder, margin: '12px 0' }} />

          {/* 第三部分：描述文字 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.7 }}>
              {isEn ? (
                <>
                  <p style={{ margin: '0 0 10px 0' }}>
                    I am the developer of Vedabase Web: Patrick. If you have any e-book resources or spiritual teacher lectures, please contact me.
                  </p>
                  <p style={{ margin: '0' }}>
                    If you have any suggestions for improving Vedabase or ideas for cooperation, you can contact me through this QR code.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 10px 0' }}>
                    我是韦达书库网页版的开发者：大星Patrick。如果您有任何电子版书籍的资源，或者灵性导师的讲课等资源，可以联系我。
                  </p>
                  <p style={{ margin: '0' }}>
                    如果您对韦达书库有任何改进的建议、合作的想法，可以通过这个二维码联系开发者。
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 前三个部分与第四个部分的分隔线（粗） */}
          <div style={{ height: '2px', background: heavyBorder, margin: '16px 0' }} />

          {/* 第四部分：邮箱 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '8px' }}>
              {isEn ? 'Email' : '邮箱'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: textPrimary, fontWeight: 500 }}>
              3431503934@qq.com
            </div>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              background: accentColor,
              border: 'none',
              borderRadius: '8px',
              color: cardBg,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isEn ? 'Close' : '关闭'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
