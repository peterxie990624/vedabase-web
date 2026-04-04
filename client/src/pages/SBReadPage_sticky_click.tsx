// 顶部块的篇点击处理
{stickyCantoTitle && (
  <div style={{
    fontSize: '0.8rem',
    fontWeight: 700,
    color: isDark ? '#d4a017' : '#b8860b',
    fontFamily: "'Noto Serif SC', serif",
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: stickyChapterTitle ? '6px' : '0',
    cursor: 'pointer',
  }}
  onClick={() => {
    // 点击篇标题，滑到该篇的第一章
    const targetCanto = cantos.find(c => {
      const label = isEn ? c.en_name : c.zh_name;
      const subtitle = isEn ? (c.en_subtitle || '') : (c.zh_subtitle || '');
      const fullTitle = subtitle ? `${label} ${subtitle}` : label;
      return fullTitle === stickyCantoTitle;
    });
    if (targetCanto) {
      const firstChapter = chapters.find(ch => ch.canto_id === targetCanto.id);
      if (firstChapter) {
        goTo(firstChapter.id, 0, 'left');
      }
    }
  }}>
    {stickyCantoTitle}
  </div>
)}

// 顶部块的章点击处理
{stickyChapterTitle && (
  <div style={{
    fontSize: '0.75rem',
    fontWeight: 600,
    color: isDark ? '#c8a84b' : '#a08030',
    fontFamily: "'Noto Serif SC', serif",
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  }}
  onClick={() => {
    // 点击章标题，滑到该章
    const targetChapter = chapters.find(ch => {
      const chapterName = isEn ? ch.en_name : ch.zh_name;
      const chapterTitle = isEn ? (ch.en_title || ch.zh_title || '') : (ch.zh_title || ch.en_title || '');
      const fullTitle = `${chapterName} ${chapterTitle}`;
      return fullTitle === stickyChapterTitle;
    });
    if (targetChapter) {
      goTo(targetChapter.id, 0, 'left');
    }
  }}>
    {stickyChapterTitle}
  </div>
)}
