export const locales = ['zh', 'en', 'fr'] as const;
export type Locale = (typeof locales)[number];
