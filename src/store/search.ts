import { create } from 'zustand'

interface SearchFormData {
  pos0: string
  neg0: string
  pos1: string
  neg1: string
}

interface SearchResult {
  id: string
  lang0: string
  lang1: string
  matchType: string[]
}

interface SearchStore {
  results: SearchResult[]
  loading: boolean
  totalBlocks: number
  search: (formData: SearchFormData) => Promise<void>
}

export const useSearchStore = create<SearchStore>((set) => ({
  results: [],
  loading: false,
  totalBlocks: 0,
  search: async (formData) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      set({ 
        results: data.results,
        totalBlocks: data.total_blocks || 0
      })
    } catch (error) {
      console.error('Search error:', error)
      set({ results: [], totalBlocks: 0 })
    } finally {
      set({ loading: false })
    }
  },
}))
