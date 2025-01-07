import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 标准化引号
function normalizeQuotes(text: string) {
  const quotes = ["'", "'", "'", "`", "′", "‵", "՚", "＇", "｀"];
  let result = text;
  quotes.forEach(quote => {
    result = result.replace(new RegExp(quote, 'g'), "'");
  });
  return result;
}

// 高亮搜索词
function highlightSearchTerms(text: string, searchParams: any) {
  let result = text;
  
  // 处理正向搜索词
  if (searchParams.pos0 || searchParams.pos1) {
    const terms = [];
    if (searchParams.pos0) {
      terms.push(...searchParams.pos0.split(/\s+/).filter(Boolean));
    }
    if (searchParams.pos1) {
      terms.push(...searchParams.pos1.split(/\s+/).filter(Boolean));
    }

    terms.forEach(term => {
      const subTerms = term.split('|');
      subTerms.forEach((subTerm: string) => {
        if (subTerm.trim()) {
          const isChinese = /[\u4e00-\u9fa5]/.test(subTerm);
          const normalizedTerm = normalizeQuotes(subTerm.trim());

          if (normalizedTerm.includes('.*')) {
            const pattern = isChinese
              ? normalizedTerm.replace(/\.\*/g, '[\\u4e00-\\u9fa5]*?')
              : normalizedTerm.replace(/\.\*/g, '[a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿæœA-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸÆŒ]*');
            const regex = isChinese
              ? new RegExp(`((?:^|\\s)${pattern}(?:\\s|$))`, 'g')
              : new RegExp(`\\b(${pattern})\\b`, 'gi');
            result = result.replace(regex, '<span class="alisqp">$1</span>');
          } else {
            const quoteParts = normalizedTerm.split("'");
            if (quoteParts.length === 2) {
              const pattern = `\\b${quoteParts[0]}['''′‵՚＇｀]${quoteParts[1]}\\b`;
              const regex = new RegExp(pattern, 'gi');
              const matches = result.match(regex);
              if (matches) {
                matches.forEach(match => {
                  result = result.replace(match, `<span class="alisqp">${match}</span>`);
                });
              }
            } else {
              const regex = isChinese
                ? new RegExp(`((?:^|\\s)${normalizedTerm}(?:\\s|$))`, 'g')
                : new RegExp(`\\b(${normalizedTerm})\\b`, 'gi');
              result = result.replace(regex, '<span class="alisqp">$1</span>');
            }
          }
        }
      });
    });
  }

  // 处理负向搜索词
  if (searchParams.neg0 || searchParams.neg1) {
    const terms = [];
    if (searchParams.neg0) {
      terms.push(...searchParams.neg0.split(/\s+/).filter(Boolean));
    }
    if (searchParams.neg1) {
      terms.push(...searchParams.neg1.split(/\s+/).filter(Boolean));
    }

    terms.forEach(term => {
      if (term.trim()) {
        const isChinese = /[\u4e00-\u9fa5]/.test(term);
        const normalizedTerm = normalizeQuotes(term.trim());

        if (normalizedTerm.includes('.*')) {
          const pattern = isChinese
            ? normalizedTerm.replace(/\.\*/g, '[\\u4e00-\\u9fa5]*?')
            : normalizedTerm.replace(/\.\*/g, '[a-zA-Z]*?');
          const regex = isChinese
            ? new RegExp(`((?:^|\\s)${pattern}(?:\\s|$))`, 'g')
            : new RegExp(`\\b(${pattern})\\b`, 'gi');
          result = result.replace(regex, '<span class="alisqn">$1</span>');
        } else {
          const regex = isChinese
            ? new RegExp(`((?:^|\\s)${normalizedTerm}(?:\\s|$))`, 'g')
            : new RegExp(`\\b(${normalizedTerm})\\b`, 'gi');
          result = result.replace(regex, '<span class="alisqn">$1</span>');
        }
      }
    });
  }

  return result;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // 从 URL 获取搜索参数
    const url = new URL(request.url);
    const searchParams = {
      pos0: url.searchParams.get('pos0') || '',
      neg0: url.searchParams.get('neg0') || '',
      pos1: url.searchParams.get('pos1') || '',
      neg1: url.searchParams.get('neg1') || ''
    };

    // 获取文本内容
    const { rows } = await query(
      'SELECT * FROM texts WHERE id = $1',
      [idNum]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Text not found' },
        { status: 404 }
      );
    }

    const text = rows[0];

    // 高亮处理
    const highlightedLang0 = highlightSearchTerms(text.lang0, {
      pos0: searchParams.pos0,
      neg0: searchParams.neg0
    });
    const highlightedLang1 = highlightSearchTerms(text.lang1, {
      pos0: searchParams.pos1,
      neg0: searchParams.neg1
    });

    return NextResponse.json({
      id: text.id,
      position: text.position,
      lang0: highlightedLang0,
      lang1: highlightedLang1
    });
  } catch (error) {
    console.error('Error fetching alignment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 