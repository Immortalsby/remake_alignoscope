'use client';

import { NextIntlClientProvider } from 'next-intl';

type Props = {
  locale: string;
  messages: any;
  children: React.ReactNode;
};

export default function IntlProvider({ children, locale, messages }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
} 