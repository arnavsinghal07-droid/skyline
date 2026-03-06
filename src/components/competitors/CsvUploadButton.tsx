'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'

interface CsvUploadButtonProps {
  competitorId: string
  onUploaded: (count: number) => void
}

export function CsvUploadButton({ competitorId, onUploaded }: CsvUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('competitor_id', competitorId)

      const res = await fetch('/api/competitors/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        return
      }

      onUploaded(data.signals_extracted ?? 0)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setLoading(false)
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="inline-flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#666] bg-[#f5f5f7] border border-[#e8e8ec] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Processing CSV...
          </>
        ) : (
          <>
            <Upload size={12} />
            Upload CSV
          </>
        )}
      </button>
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}
