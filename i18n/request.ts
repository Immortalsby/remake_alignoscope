import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {headers} from 'next/headers';
import {locales} from '../src/config';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const locale = headersList.get('X-NEXT-INTL-LOCALE');
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }
 
  return {
    locale,
    messages: (await import(`../src/messages/${locale}.json`)).default
  };
});
