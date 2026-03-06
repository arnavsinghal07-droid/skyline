'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, ScanSearch, X } from 'lucide-react'
import { CsvUploadButton } from './CsvUploadButton'
import type { CompetitorRow, ScrapingJobStatus } from '@/lib/competitive/types'

interface CompetitorCardProps {
  competitor: CompetitorRow & { signal_count: number }
  onRefresh: () => void
  onDelete: (id: string) => void
}

export function CompetitorCard({ competitor, onRefresh, onDelete }: CompetitorCardProps) {
  const [scrapeStatus, setScrapeStatus] = useState<ScrapingJobStatus | 'none' | 'idle'>('idle')
  const [scrapeError, setScrapeError] = useState('')
  const [rescanStatus, setRescanStatus] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [rescanMessage, setRescanMessage] = useState('')
  const [deleting, setDeleting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  async function handleScrape() {
    setScrapeStatus('pending')
    setScrapeError('')

    try {
      const res = await fetch(`/api/competitors/${competitor.id}/scrape`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setScrapeError(data.error ?? 'Failed to start scraping')
        setScrapeStatus('idle')
        return
      }

      // Start polling job status
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/competitors/${competitor.id}/job-status`)
          const job = await pollRes.json()
          setScrapeStatus(job.status)

          if (job.status === 'completed') {
            stopPolling()
            onRefresh()
          } else if (job.status === 'failed') {
            stopPolling()
            setScrapeError(job.error_message ?? 'Scraping failed. Try uploading a CSV instead.')
          }
        } catch {
          stopPolling()
          setScrapeError('Lost connection while checking status')
          setScrapeStatus('idle')
        }
      }, 3000)
    } catch {
      setScrapeError('Failed to start scraping')
      setScrapeStatus('idle')
    }
  }

  async function handleRescan() {
    setRescanStatus('scanning')
    setRescanMessage('')

    try {
      const res = await fetch(`/api/competitors/${competitor.id}/rescan`, { method: 'POST' })
      if (!res.ok) {
        setRescanStatus('idle')
        return
      }

      // Rescan is fire-and-forget; show brief scanning state then refetch
      setTimeout(() => {
        setRescanStatus('done')
        setRescanMessage('Re-scan triggered. Refresh to see new mentions.')
        onRefresh()
        // Clear message after 4s
        setTimeout(() => {
          setRescanStatus('idle')
          setRescanMessage('')
        }, 4000)
      }, 2000)
    } catch {
      setRescanStatus('idle')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/competitors/${competitor.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(competitor.id)
      }
    } catch {
      // Silent
    } finally {
      setDeleting(false)
    }
  }

  const isScraping = scrapeStatus === 'pending' || scrapeStatus === 'processing'

  return (
    <div className="bg-white border border-[#e8e8ec] rounded-xl p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-[#111]">{competitor.name}</h3>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[#ddd] hover:text-red-400 transition-colors shrink-0 disabled:opacity-30"
          title="Remove competitor"
        >
          <X size={14} />
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-medium text-[#777] bg-[#f5f5f7] border border-[#e8e8ec] rounded-full px-2.5 py-0.5">
          {competitor.mention_count} mention{competitor.mention_count !== 1 ? 's' : ''}
        </span>
        <span className="text-[10px] font-medium text-[#777] bg-[#f5f5f7] border border-[#e8e8ec] rounded-full px-2.5 py-0.5">
          {competitor.signal_count} signal{competitor.signal_count !== 1 ? 's' : ''}
        </span>
        <span className="text-[10px] text-[#bbb]">
          {competitor.last_scraped_at
            ? `Scraped ${new Date(competitor.last_scraped_at).toLocaleDateString()}`
            : 'Never scraped'}
        </span>
      </div>

      {/* Slugs */}
      {(competitor.g2_slug || competitor.capterra_slug) && (
        <div className="flex items-center gap-2 text-[10px] text-[#bbb]">
          {competitor.g2_slug && <span>G2: {competitor.g2_slug}</span>}
          {competitor.capterra_slug && <span>Capterra: {competitor.capterra_slug}</span>}
        </div>
      )}

      {/* Scraping status */}
      {isScraping && (
        <div className="flex items-center gap-1.5 text-xs text-[#999]">
          <RefreshCw size={11} className="animate-spin" />
          Scraping in progress...
        </div>
      )}

      {scrapeError && (
        <p className="text-[10px] text-red-400">{scrapeError}</p>
      )}

      {rescanMessage && (
        <p className="text-[10px] text-emerald-500">{rescanMessage}</p>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#f0f0f3]">
        <button
          onClick={handleScrape}
          disabled={isScraping}
          className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#666] bg-[#f5f5f7] border border-[#e8e8ec] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={12} className={isScraping ? 'animate-spin' : ''} />
          Refresh
        </button>

        <CsvUploadButton
          competitorId={competitor.id}
          onUploaded={() => onRefresh()}
        />

        <button
          onClick={handleRescan}
          disabled={rescanStatus === 'scanning'}
          className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#666] bg-[#f5f5f7] border border-[#e8e8ec] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ScanSearch size={12} />
          {rescanStatus === 'scanning' ? 'Scanning...' : 'Re-scan'}
        </button>
      </div>
    </div>
  )
}
