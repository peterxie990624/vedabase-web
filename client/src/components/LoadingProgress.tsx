/**
 * LoadingProgress — 数据加载进度条组件
 *
 * 功能：
 * 1. 显示当前正在加载的资源名称和来源（jsDelivr / GitHub）
 * 2. 动态进度条（模拟 + 实际完成触发）
 * 3. 开发模式下在进度条下方显示详细诊断日志
 */
import React, { useEffect, useRef, useState } from 'react';
import type { LoadProgress } from '../hooks/useData';

interface LoadingProgressProps {
  progresses: LoadProgress[];       // 来自 useData 的进度事件列表
  totalSteps?: number;              // 总步骤数（用于计算百分比）
  isDark?: boolean;
  devMode?: boolean;                // 是否显示开发者诊断信息
}

function friendlyName(url: string): string {
  if (url.includes('bg_data')) return '博伽梵歌数据';
  if (url.includes('sb_index')) return '博伽瓦谭目录';
  if (url.includes('akadasi')) return '爱卡达西数据';
  if (url.includes('calendar')) return '韦达日历数据';
  const m = url.match(/canto_(\d+)/);
  if (m) return `博伽瓦谭第${m[1]}篇`;
  return url.split('/').pop() || url;
}

function sourceTag(source: 'jsdelivr' | 'github', isDark: boolean) {
  const isJsd = source === 'jsdelivr';
  return (
    <span style={{
      fontSize: '10px',
      padding: '1px 6px',
      borderRadius: '8px',
      background: isJsd ? (isDark ? '#1a3a2a' : '#e8f5ee') : (isDark ? '#1a2a3a' : '#e8f0f8'),
      color: isJsd ? (isDark ? '#5ad88a' : '#2a8a4a') : (isDark ? '#6aacdc' : '#2e6fa0'),
      fontWeight: 600,
      letterSpacing: '0.02em',
    }}>
      {isJsd ? 'jsDelivr' : 'GitHub'}
    </span>
  );
}

export default function LoadingProgress({
  progresses,
  totalSteps = 1,
  isDark = false,
  devMode = false,
}: LoadingProgressProps) {
  const [displayPercent, setDisplayPercent] = useState(5);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate real progress
  const completed = progresses.filter(p => p.status === 'ok' || p.status === 'error').length;
  const errors = progresses.filter(p => p.status === 'error');
  const loading = progresses.filter(p => p.status === 'loading');
  const realPercent = totalSteps > 0 ? Math.min(95, Math.round((completed / totalSteps) * 100)) : 5;

  // Animate progress bar smoothly
  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      setDisplayPercent(prev => {
        if (prev >= realPercent) {
          clearInterval(animRef.current!);
          return realPercent;
        }
        return prev + 1;
      });
    }, 20);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [realPercent]);

  const currentItem = loading[loading.length - 1] || progresses[progresses.length - 1];
  const barColor = errors.length > 0 ? '#e05050' : (isDark ? '#c8a84b' : '#4a7fa5');

  return (
    <div style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }}>
      {/* Progress bar */}
      <div style={{
        height: '4px',
        background: isDark ? '#2a3a50' : '#e0eaf2',
        borderRadius: '2px',
        overflow: 'hidden',
        marginBottom: '10px',
      }}>
        <div style={{
          height: '100%',
          width: `${displayPercent}%`,
          background: barColor,
          borderRadius: '2px',
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* Current status text */}
      {currentItem && (
        <div style={{
          fontSize: '12px',
          color: isDark ? '#8aa0b4' : '#6a8aa0',
          textAlign: 'center',
          marginBottom: devMode ? '12px' : '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          flexWrap: 'wrap',
        }}>
          {currentItem.status === 'loading' && (
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '14px' }}>⏳</span>
          )}
          <span>正在加载 {friendlyName(currentItem.url)}</span>
          {sourceTag(currentItem.source, isDark)}
          {currentItem.status === 'ok' && currentItem.durationMs && (
            <span style={{ color: isDark ? '#5ad88a' : '#2a8a4a' }}>✓ {currentItem.durationMs}ms</span>
          )}
          {currentItem.status === 'error' && (
            <span style={{ color: '#e05050' }}>✗ 失败</span>
          )}
        </div>
      )}

      {/* Dev mode: detailed log */}
      {devMode && progresses.length > 0 && (
        <div style={{
          background: isDark ? '#0a1520' : '#f0f4f8',
          border: `1px solid ${isDark ? '#2a3a50' : '#d0dde8'}`,
          borderRadius: '8px',
          padding: '10px 12px',
          fontSize: '11px',
          fontFamily: 'monospace',
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          <div style={{ color: isDark ? '#c8a84b' : '#8a6a00', fontWeight: 700, marginBottom: '6px', fontSize: '10px', letterSpacing: '0.05em' }}>
            ▶ 开发模式 · 资源加载日志
          </div>
          {progresses.map((p, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              marginBottom: '4px',
              color: p.status === 'error' ? '#e05050' : p.status === 'ok' ? (isDark ? '#5ad88a' : '#2a8a4a') : (isDark ? '#8aa0b4' : '#6a8aa0'),
            }}>
              <span style={{ flexShrink: 0 }}>
                {p.status === 'loading' ? '⏳' : p.status === 'ok' ? '✓' : '✗'}
              </span>
              <span style={{ flex: 1, wordBreak: 'break-all' }}>
                [{p.source === 'jsdelivr' ? 'jsd' : 'gh'}] {friendlyName(p.url)}
                {p.status === 'ok' && p.durationMs ? ` (${p.durationMs}ms)` : ''}
                {p.status === 'error' ? ` — ${p.error}` : ''}
              </span>
            </div>
          ))}
          {errors.length > 0 && (
            <div style={{ marginTop: '8px', padding: '6px 8px', background: isDark ? '#2a1515' : '#fff0f0', borderRadius: '4px', color: '#e05050', fontSize: '11px' }}>
              <strong>⚠ {errors.length} 个资源加载失败</strong>
              {errors.map((e, i) => (
                <div key={i} style={{ marginTop: '2px', wordBreak: 'break-all' }}>
                  · {friendlyName(e.url)}: {e.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
