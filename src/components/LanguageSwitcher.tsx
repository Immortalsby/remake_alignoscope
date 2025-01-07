'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { locales } from '@/config'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlag } from '@fortawesome/free-solid-svg-icons'

const languageNames = {
  en: 'English',
  fr: 'Français',
  zh: '中文'
}

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: string) => {
    // 获取当前路径，移除当前语言前缀
    const currentPathWithoutLocale = pathname.replace(`/${locale}`, '')
    // 添加新的语言前缀
    router.push(`/${newLocale}${currentPathWithoutLocale}`)
  }

  return (
    <div className="ms-auto btn-group">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={`btn btn-outline-primary ${locale === loc ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faFlag} /> {languageNames[loc as keyof typeof languageNames]}
        </button>
      ))}
    </div>
  )
}
