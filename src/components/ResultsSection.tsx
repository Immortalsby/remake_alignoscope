'use client'

import { useSearchStore } from '@/store/search'
import { useEffect, useState } from 'react'
import clsx from 'clsx'

interface SearchResult {
  id: string
  lang0: string
  lang1: string
  matchType: string[]
}

export default function ResultsSection() {
  const results = useSearchStore((state) => state.results)
  const loading = useSearchStore((state) => state.loading)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const getMatchClass = (result: SearchResult) => {
    const classes = []
    if (result.matchType.includes('both')) {
      classes.push('match-both')
    } else {
      if (result.matchType.includes('left')) classes.push('match-left')
      if (result.matchType.includes('right')) classes.push('match-right')
    }
    if (
      result.matchType.includes('negative_left') ||
      result.matchType.includes('negative_right')
    ) {
      classes.push('match-negative')
    }
    return clsx(classes)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!results.length) {
    return null
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div
          key={result.id}
          className={clsx(
            'p-4 rounded-lg bg-white shadow-sm cursor-pointer transition-colors',
            getMatchClass(result),
            {
              'ring-2 ring-primary-500': selectedId === result.id,
            }
          )}
          onClick={() => setSelectedId(result.id === selectedId ? null : result.id)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: result.lang0 }}
            />
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: result.lang1 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
