// 这是一个临时文件，用于存储新的searchBG函数代码
// 将在后续替换到SearchPage.tsx中

// 新的searchBG函数（第475-549行替换）
const searchBG_replacement = `
  // Helper: search BG data
  // v2: 支持中英文映射、多位置高亮、结果合并
  // 中文模式下搜英文时，自动映射到中文翻译；记录匹配位置用于阅读页高亮
  const searchBG = useCallback((keyword: string, q: string): SearchResult[] => {
    if (!bgData) return [];
    const found: SearchResult[] = [];
    const kwLower = keyword.toLowerCase();
    const kwNorm = normalizeSanskrit(keyword);
    const isEnKeyword = /[a-zA-Z]/.test(q.trim());
    
    // 辅助函数：检查文本是否包含关键词（支持梵文规范化）
    const textContainsKw = (text: string): boolean => {
      if (!text) return false;
      if (text.toLowerCase().includes(kwLower)) return true;
      return normalizeSanskrit(text).includes(kwNorm);
    };
    
    // 辅助函数：确定匹配位置和高亮关键词
    const getMatchInfo = (section: any): {
      matchLocation: 'sanskrit' | 'translation' | 'wordmeaning' | 'purport';
      highlightKeyword: string;
      isMissingChinese: boolean;
    } | null => {
      // 优先级顺序：词义 > 梵文 > 译文 > 要旨
      
      // 1. 检查中文词义字段
      if (section.words_zh_fc && textContainsKw(section.words_zh_fc)) {
        return {
          matchLocation: 'wordmeaning',
          highlightKeyword: keyword,
          isMissingChinese: false,
        };
      }
      
      // 2. 检查英文词义字段
      if (section.words_en_fc && textContainsKw(section.words_en_fc)) {
        // 中文模式搜英文：尝试从中文词义映射
        if (language === 'zh' && isEnKeyword && section.words_zh_fc) {
          const zhWords = section.words_zh_fc.split(';').map((s: string) => s.trim()).filter(Boolean);
          return {
            matchLocation: 'wordmeaning',
            highlightKeyword: zhWords[0] || keyword,
            isMissingChinese: false,
          };
        }
        // 中文模式搜英文但无中文词义 → 标记缺失
        if (language === 'zh' && isEnKeyword) {
          return {
            matchLocation: 'wordmeaning',
            highlightKeyword: keyword,
            isMissingChinese: true,
          };
        }
        return {
          matchLocation: 'wordmeaning',
          highlightKeyword: keyword,
          isMissingChinese: false,
        };
      }
      
      // 3. 检查梵文字段
      if (section.ldw_fd && textContainsKw(section.ldw_fd)) {
        // 梵文命中：中文模式下尝试从中文译文映射
        if (language === 'zh' && section.yw_zh) {
          return {
            matchLocation: 'sanskrit',
            highlightKeyword: section.yw_zh,
            isMissingChinese: false,
          };
        }
        return {
          matchLocation: 'sanskrit',
          highlightKeyword: keyword,
          isMissingChinese: false,
        };
      }
      
      // 4. 检查中文译文字段
      if (section.yw_zh && textContainsKw(section.yw_zh)) {
        return {
          matchLocation: 'translation',
          highlightKeyword: keyword,
          isMissingChinese: false,
        };
      }
      
      // 5. 检查英文译文字段
      if (section.yw_en && textContainsKw(section.yw_en)) {
        // 英文译文命中：中文模式下尝试从中文译文映射
        if (language === 'zh' && section.yw_zh) {
          return {
            matchLocation: 'translation',
            highlightKeyword: section.yw_zh,
            isMissingChinese: false,
          };
        }
        // 中文模式搜英文但无中文译文
        if (language === 'zh') {
          return {
            matchLocation: 'translation',
            highlightKeyword: keyword,
            isMissingChinese: true,
          };
        }
        return {
          matchLocation: 'translation',
          highlightKeyword: keyword,
          isMissingChinese: false,
        };
      }
      
      // 6. 检查中文要旨字段
      if (section.yz_zh && textContainsKw(section.yz_zh)) {
        return {
          matchLocation: 'purport',
          highlightKeyword: keyword,
          isMissingChinese: false,
        };
      }
      
      // 7. 检查英文要旨字段
      if (section.yz_en && textContainsKw(section.yz_en)) {
        // 英文要旨命中：中文模式下尝试从中文要旨映射
        if (language === 'zh' && section.yz_zh) {
          return {
            matchLocation: 'purport',
            highlightKeyword: section.yz_zh,
            isMissingChinese: false,
          };
        }
        if (language === 'zh') {
          return {
            matchLocation: 'purport',
            highlightKeyword: keyword,
            isMissingChinese: true,
          };
        }
        return {
          matchLocation: 'purport',
          highlightKeyword: keyword,
          isMissingChinese: false,
        };
      }
      
      return null;
    };
    
    for (const [chIdStr, sections] of Object.entries(bgData.sections)) {
      const chId = parseInt(chIdStr);
      (sections as Array<{
        id: number; section_id: string | number;
        yw_zh: string | null; yw_en: string | null;
        yz_zh: string | null; yz_en: string | null;
        words_zh_fc: string | null; words_en_fc: string | null;
        ldw_fd: string | null;  // 梵文原文（BG）
      }>).forEach((section, idx) => {
        const zhText = [section.yw_zh, section.yz_zh, section.words_zh_fc].filter(Boolean).join(' ');
        const enText = [section.yw_en, section.yz_en, section.words_en_fc, section.ldw_fd].filter(Boolean).join(' ');
        const allText = zhText + ' ' + enText;
        
        if (!textContainsKw(allText)) return;
        
        // 获取匹配信息（位置、高亮关键词、是否缺失中文）
        const matchInfo = getMatchInfo(section);
        if (!matchInfo) return;
        
        // 英文关键词搜索时，尝试构建英中词义对照预览
        let wordPairPreview: string | null = null;
        if (isEnKeyword && section.words_en_fc && section.words_zh_fc) {
          wordPairPreview = buildWordPairPreview(section.words_en_fc, section.words_zh_fc, kwLower, kwNorm);
        }
        
        // 选择预览字段：优先选择包含关键词的字段
        const candidates = language === 'zh'
          ? [
              section.words_zh_fc,  // 中文词义
              section.words_en_fc,  // 英文词义（梵文匹配时用）
              section.ldw_fd,       // 梵文原文
              section.yw_zh,        // 中文译文
              section.yz_zh,        // 中文要旨
              section.yw_en,        // 英文译文
              section.yz_en,        // 英文要旨
            ]
          : [
              section.words_en_fc,  // 英文词义
              section.words_zh_fc,  // 中文词义
              section.ldw_fd,       // 梵文原文
              section.yw_en,        // 英文译文
              section.yz_en,        // 英文要旨
              section.yw_zh,        // 中文译文
              section.yz_zh,        // 中文要旨
            ];
        
        // 找到第一个包含关键词的字段作为预览
        const rawPreview = candidates.find(c => c && textContainsKw(c)) || candidates.find(Boolean) || '';
        // 如果有英中对照预览，优先使用（更直观）
        let preview = wordPairPreview || extractPreview(rawPreview, q, 100);
        
        // 如果中文缺失，添加标记
        if (matchInfo.isMissingChinese && language === 'zh') {
          preview = \`[无中文翻译] \${preview}\`;
        }
        
        found.push({
          bookType: 'bg',
          chapterId: chId,
          sectionIndex: idx,
          sectionId: String(section.section_id),
          label: formatSectionLabel('bg', section.section_id, language),
          preview,
          searchKeyword: q.trim(),
          highlightKeyword: matchInfo.highlightKeyword,
          matchLocation: matchInfo.matchLocation,
          isMissingChinese: matchInfo.isMissingChinese,
        });
      });
    }
    return found;
  }, [bgData, language, buildWordPairPreview]);
`;
