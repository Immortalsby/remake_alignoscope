export interface SearchResult {
  id: number;
  lang0: string;
  lang1: string;
  volume: number;
  position: number;
  match_type?: string[];
}

export interface SearchParams {
  pos0: string;
  neg0: string;
  pos1: string;
  neg1: string;
}

export interface SearchStats {
  total_blocks: number;
  total_volumes: number;
  total_matches: number;
  left_matches: number;
  right_matches: number;
  positive_matches: number;
  negative_matches: number;
}

// 判断文本是否匹配搜索条件
export function isMatch(text: string, searchTerms: string, isNegative: boolean = false): boolean {
  // 如果没有搜索条件
  if (!searchTerms || !searchTerms.trim()) {
    return isNegative;
  }

  // 过滤掉元数据标记
  const cleanText = text.replace(/<[^>]+>/g, '').trim();
  
  // 如果过滤后文本为空，则不应该匹配
  if (!cleanText) {
    return false;
  }

  // 判断是否为中文搜索
  const isChinese = /[\u4e00-\u9fa5]/.test(searchTerms);
  
  const terms = searchTerms.trim().split(' ').filter(term => term.trim());
  
  // 如果分割后没有有效的搜索词
  if (terms.length === 0) {
    return isNegative;
  }
  
  // 对于负向搜索，任何一个词匹配都返回false
  if (isNegative) {
    return !terms.some(term => {
      const subTerms = term.split('|');
      return subTerms.some(subTerm => {
        const pattern = subTerm.trim().replace('_', ' ');
        try {
          if (isChinese) {
            // 中文搜索：使用空格作为分隔符
            const words = cleanText.split(' ');
            return pattern && words.some(word => word === pattern);
          } else {
            // 法文搜索：使用单词边界和不区分大小写
            const regex = new RegExp(`\\b${pattern}\\b`, 'i');
            return pattern && regex.test(cleanText);
          }
        } catch (e) {
          // 如果正则表达式无效，回退到基本匹配
          if (isChinese) {
            const words = cleanText.split(' ');
            return pattern && words.some(word => word === pattern);
          } else {
            return pattern && cleanText.toLowerCase().includes(pattern.toLowerCase());
          }
        }
      });
    });
  }
  
  // 对于正向搜索，所有词都要匹配
  return terms.every(term => {
    const subTerms = term.split('|');
    return subTerms.some(subTerm => {
      const pattern = subTerm.trim().replace('_', ' ');
      try {
        if (isChinese) {
          // 中文搜索：使用空格作为分隔符
          const words = cleanText.split(' ');
          return pattern && words.some(word => word === pattern);
        } else {
          // 法文搜索：使用单词边界和不区分大小写
          const regex = new RegExp(`\\b${pattern}\\b`, 'i');
          return pattern && regex.test(cleanText);
        }
      } catch (e) {
        // 如果正则表达式无效，回退到基本匹配
        if (isChinese) {
          const words = cleanText.split(' ');
          return pattern && words.some(word => word === pattern);
        } else {
          return pattern && cleanText.toLowerCase().includes(pattern.toLowerCase());
        }
      }
    });
  });
}

// 获取方块的匹配类型
export function getBlockMatchTypes(result: SearchResult, searchParams: SearchParams): string[] {
  const matchTypes: string[] = [];
  
  // 检查左侧正向匹配
  const leftMatch = isMatch(result.lang0, searchParams.pos0);
  const leftNegMatch = isMatch(result.lang0, searchParams.neg0, true);
  
  // 检查右侧正向匹配
  const rightMatch = isMatch(result.lang1, searchParams.pos1);
  const rightNegMatch = isMatch(result.lang1, searchParams.neg1, true);
  

    // 处理左侧正向匹配（只考虑包含条件）
  if (searchParams.pos0) {
    if (leftMatch) {
      matchTypes.push('positive_left');
    }
  }
  
  // 处理右侧正向匹配（只考虑包含条件）
  if (searchParams.pos1) {
    if (rightMatch) {
      matchTypes.push('positive_right');
    }
  }
  
  // 处理左侧匹配（考虑包含和不包含条件）
  if (!searchParams.pos0 && !searchParams.neg0) {
    // 如果左侧没有任何搜索条件，则默认匹配
    matchTypes.push('left');
  } else if (searchParams.pos0) {
    // 有正向搜索条件时，需要匹配正向条件且不被负向条件排除
    if (leftMatch && leftNegMatch) {
      matchTypes.push('left');
    }
  } else if (searchParams.neg0) {
    // 只有负向搜索条件时，只要通过负向匹配就算匹配
    if (leftNegMatch) {
      matchTypes.push('left');
    }
  }
  
  // 处理右侧匹配（考虑包含和不包含条件）
  if (!searchParams.pos1 && !searchParams.neg1) {
    // 如果右侧没有任何搜索条件，则默认匹配
    matchTypes.push('right');
  } else if (searchParams.pos1) {
    // 有正向搜索条件时，需要匹配正向条件且不被负向条件排除
    if (rightMatch && rightNegMatch) {
      matchTypes.push('right');
    }
  } else if (searchParams.neg1) {
    // 只有负向搜索条件时，只要通过负向匹配就算匹配
    if (rightNegMatch) {
      matchTypes.push('right');
    }
  }
  
  // 如果左右都匹配，添加both标记
  if (matchTypes.includes('left') && matchTypes.includes('right')) {
    matchTypes.push('both');
  }
  
  // 记录未通过负向匹配的情况
  if (!leftNegMatch) {
    matchTypes.push('negative_left');
  }
  if (!rightNegMatch && searchParams.neg1) { // 只在有负向搜索条件时才添加negative_right标记
    matchTypes.push('negative_right');
  }
  
  return matchTypes;
}

// 获取方块的CSS类名
export function getBlockClass(matchTypes: string[] | undefined, side: 'left' | 'right'): string {
  if (!matchTypes || matchTypes.length === 0) return 'alisq';  // 无填充色：不符合相关区域的搜索
  
  // 深绿色：完全符合对两种语言的搜索
  if (matchTypes.includes('both')) {
    return 'alisq deep-green';
  }
  
  // 浅绿色：符合相关区域的搜索，但并不满足另一种语言中的搜索
  // 根据指定的侧来判断是否匹配
  if (side === 'left' && matchTypes.includes('left')) {
    return 'alisq light-green';
  }
  if (side === 'right' && matchTypes.includes('right')) {
    return 'alisq light-green';
  }
  
  // 无填充色：不符合相关区域的搜索
  return 'alisq';
}

// 计算搜索统计信息
export function calculateSearchStats(results: SearchResult[], searchParams: SearchParams): SearchStats {
  let total_matches = 0;
  let left_matches = 0;
  let right_matches = 0;
  let positive_matches = 0;
  let negative_matches = 0;

  results.forEach(result => {
    const matchTypes = getBlockMatchTypes(result, searchParams);
    
    // 完全匹配：必须同时满足左右匹配且不被负向匹配排除
    if (matchTypes.includes('both') && 
        !matchTypes.includes('negative_left') && 
        !matchTypes.includes('negative_right')) {
      total_matches++;
    }
    
    // 左侧匹配：必须满足左侧匹配且不被左侧负向匹配排除
    if ((matchTypes.includes('left') || matchTypes.includes('both')) &&
        !matchTypes.includes('negative_left')) {
      left_matches++;
    }
    
    // 右侧匹配：必须满足右侧匹配且不被右侧负向匹配排除
    if ((matchTypes.includes('right') || matchTypes.includes('both')) &&
        !matchTypes.includes('negative_right')) {
      right_matches++;
    }
    
    // 正向匹配：根据搜索条件的组合来决定
    if (searchParams.pos0 && searchParams.pos1) {
      // 如果两侧都有包含条件，需要同时满足
      if (matchTypes.includes('left') && matchTypes.includes('right')) {
        positive_matches++;
      }
    } else if (searchParams.pos0 && !searchParams.pos1) {
      // 如果只有左侧有包含条件
      if (matchTypes.includes('left') || matchTypes.includes('both') || matchTypes.includes('positive_left')) {
        positive_matches++;
      }
    } else if (!searchParams.pos0 && searchParams.pos1) {
      // 如果只有右侧有包含条件
      if (matchTypes.includes('right') || matchTypes.includes('both') || matchTypes.includes('positive_right')) {
        positive_matches++;
      }
    }
    
    // 负向匹配：根据搜索条件的组合来决定
    if (searchParams.neg0 && searchParams.neg1) {
      // 如果两侧都有不包含条件，需要同时满足
      if (matchTypes.includes('negative_left') && matchTypes.includes('negative_right')) {
        negative_matches++;
      }
    } else {
      // 如果只有一侧有不包含条件，满足任一即可
      if (matchTypes.includes('negative_left') || matchTypes.includes('negative_right')) {
        negative_matches++;
      }
    }
  });

  return {
    total_blocks: results.length,
    total_volumes: Math.max(...results.map(r => r.volume), 0),
    total_matches,
    left_matches,
    right_matches,
    positive_matches,
    negative_matches
  };
}

// 调试方法：显示方块的所有标记和匹配信息
export function debugBlock(result: SearchResult, searchParams: SearchParams) {
  // 如果不是 debug 模式，直接返回
  if (process.env.DEBUG_MODE !== 'true') return;
  
  const matchTypes = getBlockMatchTypes(result, searchParams);
  
  console.log('=== Debug Block Info ===');
  console.log(`Block ID: ${result.id}`);
  console.log('Match Types:', matchTypes);
  
  // 显示匹配详情
  console.log('\nMatching Details:');
  console.log('Left Text:', result.lang0);
  console.log('Right Text:', result.lang1);
  
  // 显示搜索条件匹配结果
  console.log('\nSearch Results:');
  console.log('Left Positive Match:', isMatch(result.lang0, searchParams.pos0));
  console.log('Left Negative Match:', isMatch(result.lang0, searchParams.neg0, true));
  console.log('Right Positive Match:', isMatch(result.lang1, searchParams.pos1));
  console.log('Right Negative Match:', isMatch(result.lang1, searchParams.neg1, true));
  
  // 显示搜索条件
  console.log('\nSearch Parameters:');
  console.log('Left Positive:', searchParams.pos0 || '(none)');
  console.log('Left Negative:', searchParams.neg0 || '(none)');
  console.log('Right Positive:', searchParams.pos1 || '(none)');
  console.log('Right Negative:', searchParams.neg1 || '(none)');
  
  console.log('\nCSS Class:', getBlockClass(matchTypes, 'left'));
  console.log('======================');
} 