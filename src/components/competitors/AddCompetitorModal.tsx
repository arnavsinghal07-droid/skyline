'use client'

import { useState } from 'react'
import { Check, ChevronRight, Loader2, Plus, Search, Sparkles, X } from 'lucide-react'
import type { CompetitorRow } from '@/lib/competitive/types'

interface AddCompetitorModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: (competitor: CompetitorRow) => void
}

interface DiscoveredCompetitor {
  name: string
  description: string
  g2_slug: string | null
  capterra_slug: string | null
  relevance: 'direct' | 'adjacent' | 'emerging'
}

type Mode = 'choose' | 'discover' | 'manual'

export function AddCompetitorModal({ isOpen, onClose, onAdded }: AddCompetitorModalProps) {
  const [mode, setMode] = useState<Mode>('choose')

  // Discovery state
  const [companyInput, setCompanyInput] = useState('')
  const [productInput, setProductInput] = useState('')
  const [industryInput, setIndustryInput] = useState('')
  const [discovering, setDiscovering] = useState(false)
  const [discovered, setDiscovered] = useState<DiscoveredCompetitor[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [addingDiscovered, setAddingDiscovered] = useState(false)

  // Manual state
  const [name, setName] = useState('')
  const [g2Slug, setG2Slug] = useState('')
  const [capterraSlug, setCapterraSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  function reset() {
    setMode('choose')
    setCompanyInput('')
    setProductInput('')
    setIndustryInput('')
    setDiscovering(false)
    setDiscovered([])
    setSelected(new Set())
    setAddingDiscovered(false)
    setName('')
    setG2Slug('')
    setCapterraSlug('')
    setLoading(false)
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleDiscover() {
    if (discovering) return
    if (!companyInput.trim() && !productInput.trim() && !industryInput.trim()) return

    setDiscovering(true)
    setError('')
    setDiscovered([])
    setSelected(new Set())

    try {
      const res = await fetch('/api/competitors/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyInput.trim() || undefined,
          product: productInput.trim() || undefined,
          industry: industryInput.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Discovery failed')
        return
      }

      setDiscovered(data.competitors ?? [])
      // Pre-select all direct competitors
      const directIndices = new Set<number>()
      ;(data.competitors ?? []).forEach((c: DiscoveredCompetitor, i: number) => {
        if (c.relevance === 'direct') directIndices.add(i)
      })
      setSelected(directIndices)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setDiscovering(false)
    }
  }

  function toggleSelected(index: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function handleAddSelected() {
    if (selected.size === 0 || addingDiscovered) return
    setAddingDiscovered(true)
    setError('')

    const toAdd = Array.from(selected).map(i => discovered[i])
    let lastAdded: CompetitorRow | null = null
    let addedCount = 0

    for (const comp of toAdd) {
      try {
        const res = await fetch('/api/competitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: comp.name,
            g2_slug: comp.g2_slug,
            capterra_slug: comp.capterra_slug,
          }),
        })

        const data = await res.json()
        if (res.status === 402) {
          setError(`Plan limit reached after adding ${addedCount} competitor${addedCount !== 1 ? 's' : ''}. Upgrade to add more.`)
          break
        }
        if (res.ok) {
          lastAdded = data.competitor
          addedCount++
        }
      } catch {
        // Continue with remaining
      }
    }

    setAddingDiscovered(false)
    if (lastAdded) {
      onAdded(lastAdded)
      handleClose()
    }
  }

  async function handleManualAdd() {
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

      onAdded(data.competitor)
      handleClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const relevanceColor: Record<string, string> = {
    direct: 'bg-red-500/10 text-red-500 border-red-500/20',
    adjacent: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    emerging: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-white border border-[#e8e8ec] rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {mode !== 'choose' && (
              <button
                onClick={() => { setMode('choose'); setError(''); setDiscovered([]) }}
                className="text-[#999] hover:text-[#666] transition-colors text-xs"
              >
                Back
              </button>
            )}
            <h2
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-base font-semibold text-[#111]"
            >
              {mode === 'choose' && 'Add Competitors'}
              {mode === 'discover' && 'Discover Competitors'}
              {mode === 'manual' && 'Add Manually'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-[#ccc] hover:text-[#888] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode: Choose */}
        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('discover')}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-[#e8e8ec] hover:border-[#ccc] hover:bg-[#fafafa] transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111]">Discover with AI</p>
                <p className="text-xs text-[#999] mt-0.5">
                  Describe your company or product and we'll find your competitors
                </p>
              </div>
              <ChevronRight size={14} className="text-[#ccc] group-hover:text-[#999] transition-colors" />
            </button>

            <button
              onClick={() => setMode('manual')}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-[#e8e8ec] hover:border-[#ccc] hover:bg-[#fafafa] transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] border border-[#e8e8ec] flex items-center justify-center flex-shrink-0">
                <Plus size={16} className="text-[#999]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111]">Add manually</p>
                <p className="text-xs text-[#999] mt-0.5">
                  Enter competitor name and optional G2/Capterra slugs
                </p>
              </div>
              <ChevronRight size={14} className="text-[#ccc] group-hover:text-[#999] transition-colors" />
            </button>
          </div>
        )}

        {/* Mode: Discover */}
        {mode === 'discover' && (
          <div className="space-y-4">
            {/* Input fields */}
            {discovered.length === 0 && (
              <>
                <p className="text-xs text-[#999]">
                  Tell us about your company or product and we'll suggest competitors to track.
                </p>
                <div>
                  <label className="block text-xs text-[#999] uppercase tracking-wider mb-1.5">
                    Company or Product Name
                  </label>
                  <input
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    placeholder="e.g. Figma, Notion, Linear"
                    className="w-full bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-3 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] outline-none focus:border-[#bbb] transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#999] uppercase tracking-wider mb-1.5">
                    Product Description (optional)
                  </label>
                  <input
                    type="text"
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    placeholder="e.g. Design collaboration tool for teams"
                    className="w-full bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-3 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] outline-none focus:border-[#bbb] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#999] uppercase tracking-wider mb-1.5">
                    Industry (optional)
                  </label>
                  <input
                    type="text"
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    placeholder="e.g. SaaS, Developer Tools, Project Management"
                    className="w-full bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-3 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] outline-none focus:border-[#bbb] transition-colors"
                  />
                </div>

                <button
                  onClick={handleDiscover}
                  disabled={discovering || (!companyInput.trim() && !productInput.trim() && !industryInput.trim())}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#111] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#222] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {discovering ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Search size={13} />
                      Find Competitors
                    </>
                  )}
                </button>
              </>
            )}

            {/* Discovery results */}
            {discovered.length > 0 && (
              <>
                <p className="text-xs text-[#999]">
                  Select competitors to add. Direct competitors are pre-selected.
                </p>
                <div className="space-y-2">
                  {discovered.map((comp, i) => (
                    <button
                      key={i}
                      onClick={() => toggleSelected(i)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                        selected.has(i)
                          ? 'border-[#111] bg-[#fafafa]'
                          : 'border-[#e8e8ec] hover:border-[#ccc]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        selected.has(i)
                          ? 'bg-[#111] border-[#111]'
                          : 'border-[#ddd] bg-white'
                      }`}>
                        {selected.has(i) && <Check size={10} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#111]">{comp.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${relevanceColor[comp.relevance] ?? relevanceColor.direct}`}>
                            {comp.relevance}
                          </span>
                        </div>
                        <p className="text-xs text-[#999] mt-0.5 line-clamp-2">{comp.description}</p>
                        {(comp.g2_slug || comp.capterra_slug) && (
                          <div className="flex gap-2 mt-1">
                            {comp.g2_slug && <span className="text-[10px] text-[#bbb]">G2: {comp.g2_slug}</span>}
                            {comp.capterra_slug && <span className="text-[10px] text-[#bbb]">Capterra: {comp.capterra_slug}</span>}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => { setDiscovered([]); setSelected(new Set()) }}
                    className="text-xs text-[#999] hover:text-[#666] transition-colors"
                  >
                    Search again
                  </button>
                  <button
                    onClick={handleAddSelected}
                    disabled={selected.size === 0 || addingDiscovered}
                    className="flex items-center gap-1.5 bg-[#111] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#222] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {addingDiscovered ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        Add {selected.size} Competitor{selected.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Mode: Manual */}
        {mode === 'manual' && (
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

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-[#999] hover:text-[#666] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAdd}
                disabled={!name.trim() || loading}
                className="flex items-center gap-1.5 bg-[#111] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#222] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                Add
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mt-3">{error}</p>
        )}
      </div>
    </div>
  )
}
