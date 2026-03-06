'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Swords } from 'lucide-react'
import { AddCompetitorModal } from '@/components/competitors/AddCompetitorModal'
import { CompetitorCard } from '@/components/competitors/CompetitorCard'
import type { CompetitorRow } from '@/lib/competitive/types'

type CompetitorWithCount = CompetitorRow & { signal_count: number }

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchCompetitors = useCallback(async () => {
    try {
      const res = await fetch('/api/competitors')
      if (res.ok) {
        const data = await res.json()
        setCompetitors(data.competitors ?? [])
      }
    } catch {
      // Silent failure
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompetitors()
  }, [fetchCompetitors])

  function handleAdded() {
    fetchCompetitors()
  }

  function handleDelete(id: string) {
    setCompetitors(prev => prev.filter(c => c.id !== id))
  }

  function handleRefresh() {
    fetchCompetitors()
  }

  return (
    <div className="p-8 w-full max-w-5xl">
      {/* Page header */}
      <p className="text-xs text-[#aaa] uppercase tracking-widest mb-2">Competitive Intelligence</p>
      <div className="flex items-center justify-between mb-1">
        <h1
          style={{ fontFamily: 'var(--font-syne)' }}
          className="text-2xl font-bold text-[#111]"
        >
          Competitors
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-[#111] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#222] transition-all"
        >
          <Plus size={14} />
          Add Competitor
        </button>
      </div>
      <p className="text-sm text-[#999] mb-8">
        Track competitors and monitor signals from G2, Capterra, and your customer data
      </p>
      <div className="border-b border-[#e8e8ec] mb-8" />

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-[#ccc]" />
        </div>
      )}

      {/* Empty state */}
      {!loading && competitors.length === 0 && (
        <div className="bg-white border border-[#e8e8ec] rounded-xl py-14 flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] border border-[#e8e8ec] flex items-center justify-center mb-4">
            <Swords size={17} className="text-[#ccc]" />
          </div>
          <p
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-sm font-semibold text-[#aaa] mb-1"
          >
            No competitors tracked yet
          </p>
          <p className="text-xs text-[#ccc] mb-4">
            Add your first competitor to start monitoring
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#111] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#222] transition-all"
          >
            <Plus size={14} />
            Add Competitor
          </button>
        </div>
      )}

      {/* Competitor grid */}
      {!loading && competitors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map(comp => (
            <CompetitorCard
              key={comp.id}
              competitor={comp}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add competitor modal */}
      <AddCompetitorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={handleAdded}
      />
    </div>
  )
}
