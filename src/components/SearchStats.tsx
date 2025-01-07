'use client'

import { useSearchStore } from '@/store/search'

export default function SearchStats() {
  const results = useSearchStore((state) => state.results)
  const totalBlocks = useSearchStore((state) => state.totalBlocks)

  if (!results.length) return null

  // 统计不同类型的匹配
  const stats = {
    bothMatches: results.filter((item) =>
      item.matchType.includes('both')
    ).length,
    leftMatches: results.filter((item) =>
      item.matchType.includes('left') || item.matchType.includes('both')
    ).length,
    rightMatches: results.filter((item) =>
      item.matchType.includes('right') || item.matchType.includes('both')
    ).length,
    negativeMatches: results.filter((item) =>
      item.matchType.includes('negative_left') || item.matchType.includes('negative_right')
    ).length,
  }

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-600 text-white rounded-lg p-4 text-center">
        <div className="text-sm">总方块数</div>
        <div className="text-2xl font-semibold">{totalBlocks}</div>
      </div>
      <div className="bg-purple-600 text-white rounded-lg p-4 text-center">
        <div className="text-sm">两边匹配</div>
        <div className="text-2xl font-semibold">{stats.bothMatches}</div>
      </div>
      <div className="bg-red-500 text-white rounded-lg p-4 text-center">
        <div className="text-sm">左侧匹配</div>
        <div className="text-2xl font-semibold">{stats.leftMatches}</div>
      </div>
      <div className="bg-blue-500 text-white rounded-lg p-4 text-center">
        <div className="text-sm">右侧匹配</div>
        <div className="text-2xl font-semibold">{stats.rightMatches}</div>
      </div>
    </div>
  )
}
