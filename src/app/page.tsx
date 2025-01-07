import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { locales } from '../config';

function getPreferredLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return 'zh';

  const languages = acceptLanguage.split(',').map(lang => {
    const [code, priority = '1.0'] = lang.trim().split(';q=');
    return {
      code: code.split('-')[0],
      priority: parseFloat(priority)
    };
  }).sort((a, b) => b.priority - a.priority);

  const matchedLocale = languages.find(lang => 
    locales.includes(lang.code as any)
  );

  return matchedLocale ? matchedLocale.code : 'zh';
}

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  const locale = getPreferredLocale(acceptLanguage);
  
  console.log('=== Debug Info ===');
  console.log('Browser Accept-Language:', acceptLanguage);
  console.log('Detected Locale:', locale);
  console.log('Current URL:', headersList.get('x-url') || 'Not available');
  console.log('================');
  
  redirect(`/${locale}`);
}
