import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import AboutDialog from '../components/AboutDialog';

interface Book {
  id: string;
  zhName: string;
  enName: string;
  description: string;
  color: string;
  coverBg: string;
}

const books: Book[] = [
  {
    id: 'bg',
    zhName: '博伽梵歌原义',
    enName: 'Bhagavad-gītā As It Is',
    description: '18章657节，含梵文原文、词义、译文及要旨',
    color: '#1a5fa0',
    coverBg: 'linear-gradient(135deg, #1a3a5c 0%, #2e6fa0 50%, #4a9fd4 100%)',
  },
  {
    id: 'sb',
    zhName: '圣典博伽瓦谭',
    enName: 'Śrīmad-Bhāgavatam',
    description: '12篇336章13002节，含中英双语',
    color: '#5a3a8c',
    coverBg: 'linear-gradient(135deg, #3a1a5c 0%, #6a3a9c 50%, #9a6ad4 100%)',
  },
  {
    id: 'akadasi',
    zhName: '爱卡达西',
    enName: 'Ekādaśī',
    description: '101章，爱卡达西斋戒日的故事与规范',
    color: '#8c5a1a',
    coverBg: 'linear-gradient(135deg, #5c3a1a 0%, #9c6a2a 50%, #d4a45a 100%)',
  },
];

interface BookshelfPageProps {
  onSelectBook: (bookId: string) => void;
}

export default function BookshelfPage({ onSelectBook }: BookshelfPageProps) {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div
      style={{
        paddingTop: '56px',
        paddingBottom: '60px',
        minHeight: '100vh',
        background: 'var(--veda-bg)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '640px',
          height: '56px',
          background: 'white',
          borderBottom: '1px solid var(--veda-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(74,127,165,0.08)',
        }}
      >
        <button
          onClick={() => setShowAbout(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8aa0b4', padding: '6px' }}
          title="关于"
        >
          <Settings size={20} />
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--veda-blue)',
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          韦达书库
        </h1>
        <div style={{ width: '32px' }} />
      </div>

      {/* Hero section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a3a5c 0%, #2e6fa0 100%)',
          padding: '32px 20px 28px',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🕉️</div>
        <h2
          style={{
            margin: '0 0 6px',
            fontSize: '1.4rem',
            fontWeight: 700,
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          韦达书库
        </h2>
        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.85 }}>
          Vedic Knowledge Library · 韦达经典在线阅读
        </p>
      </div>

      {/* Books list */}
      <div style={{ padding: '16px' }}>
        <div style={{ color: '#6a8aa0', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 500 }}>
          书架
        </div>
        {books.map(book => (
          <div
            key={book.id}
            onClick={() => onSelectBook(book.id)}
            style={{
              background: 'white',
              borderRadius: '10px',
              marginBottom: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(74,127,165,0.1)',
              cursor: 'pointer',
              display: 'flex',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(74,127,165,0.18)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(74,127,165,0.1)';
            }}
          >
            {/* Cover */}
            <div
              style={{
                width: '72px',
                minHeight: '90px',
                background: book.coverBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>
                {book.id === 'bg' ? '🌿' : book.id === 'sb' ? '📜' : '🌸'}
              </span>
            </div>
            {/* Info */}
            <div style={{ padding: '14px 16px', flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--veda-text)',
                  marginBottom: '4px',
                  fontFamily: "'Noto Serif SC', serif",
                }}
              >
                {book.zhName}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#6a8aa0',
                  marginBottom: '6px',
                  fontStyle: 'italic',
                  fontFamily: "'Gentium Book Plus', serif",
                }}
              >
                {book.enName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#8aa0b4' }}>
                {book.description}
              </div>
            </div>
            {/* Arrow */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingRight: '12px',
                color: '#b0c8dc',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      <AboutDialog open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
