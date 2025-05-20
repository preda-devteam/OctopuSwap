import Cookies from 'js-cookie'
export const locales = ['en', 'zh'] as const

export const languageNames = {
  en: 'English',
  zh: '中文',
}

export type LocaleType = (typeof locales)[number]
export const defaultLocale = (Cookies.get('lang') ||
  (typeof navigator !== 'undefined' && navigator.language.slice(0, 2)) ||
  'zh') as LocaleType
