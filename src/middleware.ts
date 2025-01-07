import createMiddleware from 'next-intl/middleware';
import {locales} from './config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 根据浏览器语言获取最匹配的支持语言
function getPreferredLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'zh';

  // 解析 Accept-Language 头部
  const languages = acceptLanguage.split(',').map(lang => {
    const [code, priority = '1.0'] = lang.trim().split(';q=');
    return {
      code: code.split('-')[0], // 只取主要语言代码
      priority: parseFloat(priority)
    };
  }).sort((a, b) => b.priority - a.priority);

  // 找到第一个匹配的支持语言
  const matchedLocale = languages.find(lang => 
    locales.includes(lang.code as any)
  );

  return matchedLocale ? matchedLocale.code : 'zh';
}

const middleware = createMiddleware({
  defaultLocale: 'zh',
  locales,
  localePrefix: 'always',
  localeDetection: true
});

export default async function middlewareWrapper(request: NextRequest) {
  console.log('=== Middleware Debug Info ===');
  console.log('Request URL:', request.url);
  console.log('Accept-Language:', request.headers.get('accept-language'));
  console.log('Current pathname:', request.nextUrl.pathname);
  console.log('==========================');

  return middleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)', '/']
};
