'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { CompetitorRow } from '@/lib/competitive/types'

interface AddCompetitorModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: (competitor: CompetitorRow) => void
}

export function AddCompetitorModal({ isOpen, onClose, onAdded }: AddCompetitorModalProps) {
  const [name, setName] = useState('')
  const [g2Slug, setG2Slug] = useState('')
  const [capterraSlug, setCapterraSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleAdd() {
    const trimmedName = name.trim()
    if (!trimmedName || loading) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          g2_slug: g2Slug.trim() || null,
          capterra_slug: capterraSlug.trim() || null,
        }),
      })

      const data = await res.json()

      if (res.status === 402) {
        setError(`You've reached your plan limit of ${data.limit} competitors. Upgrade to add more.`)
        return
      }

      if (!res.ok) {
        setError(data.error ?? 'Failed to add competitor')
        return
      }

      // Reset form
      setName('')
      setG2Slug('')
      setCapterraSlug('')
      onAdded(data.competitor)
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white border border-[#e8e8ec] rounded-xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-base font-semibold text-[#111]"
          >
            Add Competitor
          </h2>
          <button
            onClick={onClose}
            className="text-[#ccc] hover:text-[#888] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#999] uppercase tracking-wider mb-1.5">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Notion"
              className="w-full bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-3 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] outline-none focus:border-[#bbb] transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-[#999] uppercase tracking-wider mb-1.5">
              G2 Slug (optional)
            </label>
            <input
              type="text"
              value={g2Slug}
              onChange={(e) => setG2Slug(e.target.value)}
              placeholder="e.g. notion"
              className="w-full bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-3 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] outline-none focus:border-[#bbb] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[#999] uppercase tracking-wider mb-1.5">
              Capterra Slug (optional)
            </label>
            <input
              type="text"
              value={capterraSlug}
              onChange={(e) => setCapterraSlug(e.target.value)}
              placeholder="e.g. notion"
              className="w-full bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-3 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] outline-none focus:border-[#bbb] transition-colors"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mt-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#999] hover:text-[#666] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || loading}
            className="flex items-center gap-1.5 bg-[#111] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#222] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
