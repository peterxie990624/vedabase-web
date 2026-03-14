import React, { useState, useMemo } from 'react';
import { useCalendarData } from '../hooks/useData';
import type { VedaTheme } from '../types';

const MONTH_NAMES_ZH = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

interface CalendarEvent {
  date: string;
  name: string[];
  important: string;
  address: string;
}

interface CalendarPageProps {
  theme?: VedaTheme;
}

export default function CalendarPage({ theme = 'light' }: CalendarPageProps) {
  const { data, loading } = useCalendarData();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthData: CalendarEvent[] = useMemo(() => {
    if (!data?.data) return [];
    const m = data.data.find((d: { month: string | number; data: CalendarEvent[] }) =>
      String(d.month) === String(selectedMonth)
    );
    return m?.data || [];
  }, [data, selectedMonth]);

  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    monthData.forEach((event: CalendarEvent) => {
      const parts = event.date.split('-');
      const day = parts[1] || parts[0];
      if (!map[day]) map[day] = [];
      map[day].push(event);
    });
    return map;
  }, [monthData]);

  const daysInMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), selectedMonth, 0).getDate();
  }, [selectedMonth, currentDate]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(currentDate.getFullYear(), selectedMonth - 1, 1).getDay();
  }, [selectedMonth, currentDate]);

  const selectedEvents = selectedDay ? (eventMap[selectedDay] || []) : [];

  return (
    <div style={{ paddingTop: '56px', paddingBottom: '60px', minHeight: '100vh', background: 'var(--veda-bg)' }}>
      {/* Top bar */}
      <div
        style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '640px', height: '56px',
          background: 'var(--veda-bg)', borderBottom: '1px solid var(--veda-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 16px', zIndex: 100, boxShadow: '0 1px 4px rgba(74,127,165,0.08)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--veda-blue)' }}>
          韦达日历
        </h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div style={{ textAlign: 'center', color: 'var(--veda-blue)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
            <div>加载中...</div>
          </div>
        </div>
      ) : (
        <>
          {/* Month selector */}
          <div style={{
            background: 'var(--veda-bg)', padding: '12px 16px',
            borderBottom: '1px solid var(--veda-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button
              onClick={() => { setSelectedMonth(m => m > 1 ? m - 1 : 12); setSelectedDay(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--veda-blue)', fontSize: '1.4rem', padding: '4px 12px' }}
            >‹</button>
            <div style={{ fontWeight: 700, color: 'var(--veda-blue-dark)', fontSize: '1rem' }}>
              {currentDate.getFullYear()}年 {MONTH_NAMES_ZH[selectedMonth - 1]}
            </div>
            <button
              onClick={() => { setSelectedMonth(m => m < 12 ? m + 1 : 1); setSelectedDay(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--veda-blue)', fontSize: '1.4rem', padding: '4px 12px' }}
            >›</button>
          </div>

          {/* Calendar grid */}
          <div style={{ background: 'var(--veda-bg)', padding: '8px 12px', marginBottom: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '12px', color: '#8aa0b4', padding: '4px 0', fontWeight: 500 }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = String(i + 1);
                const hasEvents = !!eventMap[day];
                const isToday = currentDate.getMonth() + 1 === selectedMonth && currentDate.getDate() === i + 1;
                const isSelected = selectedDay === day;
                return (
                  <div
                    key={day}
                    onClick={() => hasEvents && setSelectedDay(isSelected ? null : day)}
                    style={{
                      textAlign: 'center', padding: '6px 2px', borderRadius: '6px',
                      cursor: hasEvents ? 'pointer' : 'default',
                      background: isSelected ? 'var(--veda-blue)' : isToday ? 'var(--veda-blue-light)' : 'transparent',
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      fontWeight: isToday || isSelected ? 700 : 400,
                      color: isSelected ? 'white' : isToday ? 'var(--veda-blue)' : 'var(--veda-text)',
                    }}>
                      {i + 1}
                    </div>
                    {hasEvents && (
                      <div style={{
                        width: '4px', height: '4px', borderRadius: '50%',
                        background: isSelected ? 'white' : 'var(--veda-blue)',
                        margin: '2px auto 0',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events list */}
          <div style={{ padding: '0 16px 16px' }}>
            {selectedDay ? (
              <>
                <div style={{ fontSize: '13px', color: '#6a8aa0', marginBottom: '8px', fontWeight: 500 }}>
                  {selectedMonth}月{selectedDay}日 的节日
                </div>
                {selectedEvents.length > 0 ? selectedEvents.map((event, idx) => (
                  <div key={idx} style={{
                    background: 'var(--veda-bg)', borderRadius: '8px', padding: '12px 16px',
                    marginBottom: '8px', boxShadow: '0 1px 4px rgba(74,127,165,0.1)',
                    borderLeft: `3px solid ${event.important === 'true' ? '#e85d04' : 'var(--veda-blue)'}`,
                  }}>
                    {event.name.map((n, ni) => (
                      <div key={ni} style={{ fontSize: '0.9rem', color: 'var(--veda-text)', lineHeight: 1.7, fontFamily: "'Noto Serif SC', serif" }}>
                        {event.important === 'true' && <span style={{ color: '#e85d04', marginRight: '4px' }}>★</span>}
                        {n}
                      </div>
                    ))}
                  </div>
                )) : (
                  <div style={{ color: '#8aa0b4', textAlign: 'center', padding: '20px' }}>当天无节日</div>
                )}
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--veda-blue)', fontSize: '13px', padding: '8px 0' }}
                >
                  ← 查看本月所有节日
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '13px', color: '#6a8aa0', marginBottom: '8px', fontWeight: 500 }}>
                  本月节日（点击日期查看详情）
                </div>
                {monthData.length > 0 ? monthData.map((event: CalendarEvent, idx: number) => {
                  const parts = event.date.split('-');
                  const day = parts[1] || parts[0];
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDay(day)}
                      style={{
                        background: 'var(--veda-bg)', borderRadius: '8px', padding: '10px 16px',
                        marginBottom: '6px', boxShadow: '0 1px 4px rgba(74,127,165,0.08)',
                        cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px',
                        borderLeft: `3px solid ${event.important === 'true' ? '#e85d04' : 'var(--veda-blue)'}`,
                        transition: 'box-shadow 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(74,127,165,0.18)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(74,127,165,0.08)'}
                    >
                      <div style={{
                        minWidth: '32px', textAlign: 'center',
                        color: event.important === 'true' ? '#e85d04' : 'var(--veda-blue)',
                        fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2,
                      }}>
                        {day}
                      </div>
                      <div style={{ flex: 1 }}>
                        {event.name.map((n, ni) => (
                          <div key={ni} style={{ fontSize: '0.88rem', color: 'var(--veda-text)', lineHeight: 1.6, fontFamily: "'Noto Serif SC', serif" }}>
                            {event.important === 'true' && <span style={{ color: '#e85d04', marginRight: '4px' }}>★</span>}
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ color: '#8aa0b4', textAlign: 'center', padding: '20px', fontSize: '0.85rem' }}>
                    本月无节日数据
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
