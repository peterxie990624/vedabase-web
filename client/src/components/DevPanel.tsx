/**
 * DevPanel — 开发模式诊断面板
 *
 * 在页面底部显示一个可折叠的调试面板，包含：
 * 1. 当前页面加载的资源状态（URL、来源、耗时）
 * 2. 错误详情（HTTP 状态码、网络错误）
 * 3. 环境信息（BASE_URL、主题、语言）
 * 4. 一键重试按钮
 *
 * 仅在 devMode=true 时渲染，不影响生产环境。
 */
import React, { useState } from 'react';

interface ResourceStatus {
  name: string;          // 友好名称，如"博伽梵歌数据"
  url?: string;          // 实际请求 URL
  loading: boolean;
  error: string | null;
  source?: 'jsdelivr' | 'github' | 'local';
  durationMs?: number;
}

interface EnvInfo {
  baseUrl?: string;
  theme?: string;
  language?: string;
  [key: string]: string | undefined;
}

interface DevPanelProps {
  resources: ResourceStatus[];
  env?: EnvInfo;
  onRetry?: () => void;
  isDark?: boolean;
}

function statusIcon(r: ResourceStatus) {
  if (r.loading) return '⏳';
  if (r.error) return '✗';
  return '✓';
}

function statusColor(r: ResourceStatus, isDark: boolean) {
  if (r.loading) return isDark ? '#c8a84b' : '#8a6a00';
  if (r.error) return '#e05050';
  return isDark ? '#5ad88a' : '#2a8a4a';
}

export default function DevPanel({ resources, env, onRetry, isDark = false }: DevPanelProps) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const hasError = resources.some(r => r.error);
  const isLoading = resources.some(r => r.loading);
  const allOk = !hasError && !isLoading;

  const panelBg = isDark ? '#0a1520' : '#f0f4f8';
  const border = isDark ? '#2a3a50' : '#c8d8e8';
  const textColor = isDark ? '#c0d0e0' : '#1a3a5c';
  const subColor = isDark ? '#6a8aa0' : '#5a7a9a';
  const headerBg = isDark ? '#1a2535' : '#e0eaf2';

  return (
    <div style={{
      position: 'fixed',
      bottom: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '600px',
      zIndex: 999,
      borderRadius: '10px',
      border: `1px solid ${hasError ? '#e05050' : border}`,
      overflow: 'hidden',
      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.12)',
      fontFamily: 'monospace',
      fontSize: '12px',
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: hasError ? (isDark ? '#2a1515' : '#fff0f0') : headerBg,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: isDark ? '#c8a84b22' : '#4a7fa522', color: isDark ? '#c8a84b' : '#4a7fa5', fontWeight: 700, letterSpacing: '0.05em' }}>
            DEV
          </span>
          <span style={{ color: textColor, fontWeight: 600 }}>
            {hasError ? '⚠ 加载错误' : isLoading ? '⏳ 加载中...' : '✓ 加载完成'}
          </span>
          {!isLoading && (
            <span style={{ color: subColor, fontSize: '11px' }}>
              {resources.filter(r => !r.error && !r.loading).length}/{resources.length} 成功
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasError && onRetry && (
            <button
              onClick={e => { e.stopPropagation(); onRetry(); }}
              style={{
                background: '#e05050',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              重试
            </button>
          )}
          <span style={{ color: subColor }}>{open ? '▼' : '▲'}</span>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ background: panelBg, padding: '10px 12px' }}>
          {/* Resource list */}
          <div style={{ marginBottom: '8px' }}>
            {resources.map((r, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '4px 0',
                borderBottom: i < resources.length - 1 ? `1px solid ${isDark ? '#1a2535' : '#d8e4f0'}` : 'none',
              }}>
                <span style={{ color: statusColor(r, isDark), flexShrink: 0, fontSize: '13px' }}>
                  {statusIcon(r)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: textColor, fontWeight: 600 }}>{r.name}</div>
                  {r.url && showDetails && (
                    <div style={{ color: subColor, wordBreak: 'break-all', fontSize: '10px', marginTop: '2px' }}>
                      {r.url}
                    </div>
                  )}
                  {r.error && (
                    <div style={{ color: '#e05050', marginTop: '2px', wordBreak: 'break-word' }}>
                      {r.error}
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right', color: subColor }}>
                  {r.source && (
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '6px',
                      background: r.source === 'jsdelivr' ? (isDark ? '#1a3a2a' : '#e8f5ee') : (isDark ? '#1a2a3a' : '#e8f0f8'),
                      color: r.source === 'jsdelivr' ? (isDark ? '#5ad88a' : '#2a8a4a') : (isDark ? '#6aacdc' : '#2e6fa0'),
                      marginRight: '4px',
                    }}>
                      {r.source === 'jsdelivr' ? 'jsd' : r.source === 'github' ? 'gh' : 'local'}
                    </span>
                  )}
                  {r.durationMs && <span>{r.durationMs}ms</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Env info */}
          {env && (
            <div style={{
              background: isDark ? '#0f1923' : '#e8f0f8',
              borderRadius: '6px',
              padding: '6px 10px',
              marginBottom: '8px',
            }}>
              {Object.entries(env).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '8px', color: subColor, fontSize: '11px' }}>
                  <span style={{ color: isDark ? '#c8a84b' : '#8a6a00', minWidth: '80px' }}>{k}</span>
                  <span style={{ color: textColor }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Toggle URL details */}
          <button
            onClick={() => setShowDetails(d => !d)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: subColor, fontSize: '11px', padding: 0 }}
          >
            {showDetails ? '▲ 隐藏 URL 详情' : '▼ 显示 URL 详情'}
          </button>
        </div>
      )}
    </div>
  );
}
