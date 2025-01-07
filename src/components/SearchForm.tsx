'use client'

import { useState } from 'react'
import { useSearchStore } from '@/store/search'

export default function SearchForm() {
  const [formData, setFormData] = useState({
    pos0: '',
    neg0: '',
    pos1: '',
    neg1: '',
  })
  const search = useSearchStore((state) => state.search)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    search(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h5 className="text-lg font-medium mb-4">
            Romain Roland: Jean-Christophe - Original
          </h5>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contains:
              </label>
              <input
                type="text"
                name="pos0"
                value={formData.pos0}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Does Not Contain:
              </label>
              <input
                type="text"
                name="neg0"
                value={formData.neg0}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h5 className="text-lg font-medium mb-4">
            Chinese Translation by Fu Lei (傅雷)
          </h5>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contains:
              </label>
              <input
                type="text"
                name="pos1"
                value={formData.pos1}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Does Not Contain:
              </label>
              <input
                type="text"
                name="neg1"
                value={formData.neg1}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Search
        </button>
      </div>
    </form>
  )
}
