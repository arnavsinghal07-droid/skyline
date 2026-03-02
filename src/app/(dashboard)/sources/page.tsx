'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react'

// ---------------------------------------------------------------------------
// CSV parser — handles quoted fields, Windows line-endings, empty trailing rows
// ---------------------------------------------------------------------------
function parseCSV(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  function parseRow(line: string): string[] {
    const cells: string[] = []
    let cell = ''
    let quoted = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { cell += '"'; i++ }
        else quoted = !quoted
      } else if (ch === ',' && !quoted) {
        cells.push(cell.trim())
        cell = ''
      } else {
        cell += ch
      }
    }
    cells.push(cell.trim())
    return cells
  }

  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(line => {
    const values = parseRow(line)
    return headers.reduce<Record<string, string>>((obj, h, i) => {
      obj[h] = values[i] ?? ''
      return obj
    }, {})
  })

  return { headers, rows }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ParsedData = { headers: string[]; rows: Record<string, string>[] }
type PageState = 'idle' | 'preview' | 'processing' | 'success' | 'error'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SourcesPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [state, setState] = useState<PageState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  // ---- file handling -------------------------------------------------------
  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file.')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const result = parseCSV(text)
      if (result.headers.length === 0) {
        setError('Could not parse the file. Make sure it has a header row.')
        return
      }
      setFileName(file.name)
      setParsed(result)
      setState('preview')
      setError(null)
    }
    reader.readAsText(file)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function reset() {
    setParsed(null)
    setFileName(null)
    setState('idle')
    setError(null)
  }

  // ---- upload --------------------------------------------------------------
  async function handleProcess() {
    if (!parsed) return
    setState('processing')
    setError(null)

    try {
      const res = await fetch('/api/sources/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed.rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setSavedCount(data.count)
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  // ---- preview rows --------------------------------------------------------
  const previewRows = parsed?.rows.slice(0, 5) ?? []
  const extraRows = (parsed?.rows.length ?? 0) - 5

  // ==========================================================================
  return (
    <div className="p-8 max-w-4xl w-full">

      {/* Header */}
      <p className="text-xs text-[#aaa] uppercase tracking-widest mb-2">Sources</p>
      <h1
        style={{ fontFamily: 'var(--font-syne)' }}
        className="text-2xl font-bold text-[#111]"
      >
        Upload Signals
      </h1>
      <p className="text-sm text-[#999] mt-1 mb-8">
        Import customer feedback from a CSV file
      </p>
      <div className="border-b border-[#e8e8ec] mb-8" />

      {/* ------------------------------------------------------------------ */}
      {/* SUCCESS STATE                                                        */}
      {/* ------------------------------------------------------------------ */}
      {state === 'success' && (
        <div className="bg-white border border-[#e8e8ec] rounded-xl p-10 flex flex-col items-center text-center">
          <CheckCircle size={32} className="text-[#777] mb-4" />
          <p
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-lg font-bold text-[#111] mb-1.5"
          >
            {savedCount} signal{savedCount !== 1 ? 's' : ''} imported
          </p>
          <p className="text-sm text-[#999] mb-7">
            Your documents are queued for processing and will appear in your workspace shortly.
          </p>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 bg-[#111] text-white rounded-lg py-2 px-4 text-xs font-semibold hover:bg-[#222] transition-all"
          >
            Upload another file
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DROPZONE (idle)                                                      */}
      {/* ------------------------------------------------------------------ */}
      {(state === 'idle' || state === 'error') && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={[
              'relative flex flex-col items-center justify-center rounded-xl border border-dashed cursor-pointer transition-all duration-150 py-16 px-8',
              dragging
                ? 'border-[#999] bg-[#f5f5f7]'
                : 'border-[#ddd] bg-white hover:border-[#bbb] hover:bg-[#fafafa]',
            ].join(' ')}
          >
            <div className="w-11 h-11 rounded-xl bg-[#f0f0f3] border border-[#e0e0e5] flex items-center justify-center mb-4">
              <Upload size={18} className="text-[#999]" />
            </div>
            <p
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-sm font-semibold text-[#555] mb-1"
            >
              Drop your CSV here
            </p>
            <p className="text-xs text-[#bbb]">or click to browse</p>
            <p className="text-[10px] text-[#ddd] mt-3 uppercase tracking-wider">
              Columns: date · customer_name · source_type · content
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onFileInput}
          />
          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-400/70 text-xs">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PREVIEW + PROCESS (preview / processing)                             */}
      {/* ------------------------------------------------------------------ */}
      {(state === 'preview' || state === 'processing') && parsed && (
        <>
          {/* File badge */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f0f0f3] border border-[#e0e0e5] flex items-center justify-center">
                <FileText size={14} className="text-[#999]" />
              </div>
              <div>
                <p className="text-sm text-[#444] font-medium">{fileName}</p>
                <p className="text-xs text-[#aaa]">
                  {parsed.rows.length} row{parsed.rows.length !== 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              disabled={state === 'processing'}
              className="text-[#bbb] hover:text-[#777] transition-colors disabled:opacity-30"
            >
              <X size={16} />
            </button>
          </div>

          {/* Preview table */}
          <div className="bg-white border border-[#e8e8ec] rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-[#e8e8ec] flex items-center justify-between">
              <p className="text-xs text-[#aaa] uppercase tracking-wider">
                Preview — first {Math.min(5, parsed.rows.length)} rows
              </p>
              <p className="text-xs text-[#ccc]">
                {parsed.headers.length} column{parsed.headers.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#ebebef]">
                    {parsed.headers.map(h => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[#aaa] font-medium uppercase tracking-wider whitespace-nowrap bg-[#fafafa]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-[#ebebef] last:border-0 hover:bg-[#fafafa] transition-colors"
                    >
                      {parsed.headers.map(h => (
                        <td
                          key={h}
                          className="px-4 py-2.5 text-[#777] whitespace-nowrap max-w-[220px] truncate"
                          title={row[h]}
                        >
                          {row[h] || <span className="text-[#ddd] italic">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {extraRows > 0 && (
              <div className="px-5 py-3 border-t border-[#ebebef] text-xs text-[#ccc]">
                + {extraRows} more row{extraRows !== 1 ? 's' : ''} not shown
              </div>
            )}
          </div>

          {/* Process button */}
          {state === 'error' && error && (
            <div className="flex items-center gap-2 mb-4 text-red-400/70 text-xs">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleProcess}
              disabled={state === 'processing'}
              className="flex items-center gap-2 bg-[#111] text-white rounded-lg py-2.5 px-5 text-sm font-semibold hover:bg-[#222] active:bg-[#333] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state === 'processing'
                ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                : 'Process Signals'
              }
            </button>
            <p className="text-xs text-[#ccc]">
              {parsed.rows.length} signal{parsed.rows.length !== 1 ? 's' : ''} will be saved
            </p>
          </div>
        </>
      )}
    </div>
  )
}
