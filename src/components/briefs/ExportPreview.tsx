'use client'

import { useState } from 'react'
import { ArrowLeft, Copy, Download, Check, AlertCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ExportPreviewProps {
  markdown: string
  title: string
  onBack: () => void
}

type CopyState = 'idle' | 'copied' | 'error'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

function parseExportSections(markdown: string): Array<{ heading: string; body: string }> {
  const sections: Array<{ heading: string; body: string }> = []
  // Split on lines starting with "## " (H2 headings)
  const parts = markdown.split(/^(?=## )/m)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed || !trimmed.startsWith('## ')) continue
    const firstNewline = trimmed.indexOf('\n')
    const heading = trimmed.slice(3, firstNewline > 0 ? firstNewline : undefined).trim()
    const body = firstNewline > 0 ? trimmed.slice(firstNewline + 1).trim() : ''
    sections.push({ heading, body })
  }
  return sections
}

function renderSectionBody(body: string): React.ReactNode {
  const blocks: React.ReactNode[] = []
  const lines = body.split('\n')
  let i = 0
  let blockIndex = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      blocks.push(
        <pre key={blockIndex++} className="bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-4 py-3 overflow-x-auto text-xs leading-relaxed my-2">
          <code className="text-[#555]">{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    // H3 heading
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={blockIndex++} className="text-xs font-semibold text-[#444] mt-4 mb-1.5">
          {line.slice(4)}
        </h3>
      )
      i++
      continue
    }

    // List item (checklist or regular)
    if (line.trimStart().startsWith('- ')) {
      // Collect consecutive list items
      const items: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('- ')) {
        items.push(lines[i].trimStart().slice(2))
        i++
      }
      blocks.push(
        <ul key={blockIndex++} className="space-y-1.5 my-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-[#666] leading-relaxed">
              <span className="text-[#ccc] shrink-0 mt-0.5">
                {item.startsWith('[ ] ') ? '\u2610' : '\u2022'}
              </span>
              <span>{item.startsWith('[ ] ') ? item.slice(4) : item}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Bold line (e.g., **Changes:** or **New Components:** ...)
    if (line.startsWith('**') && line.includes('**')) {
      const boldMatch = line.match(/^\*\*(.+?)\*\*(.*)$/)
      if (boldMatch) {
        blocks.push(
          <p key={blockIndex++} className="text-xs text-[#666] leading-relaxed mt-2">
            <span className="text-[#444] font-medium">{boldMatch[1]}</span>
            {boldMatch[2]}
          </p>
        )
        i++
        continue
      }
    }

    // Horizontal rule
    if (line.trim() === '---') {
      i++
      continue // Skip — we use section cards for separation instead
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Plain paragraph
    blocks.push(
      <p key={blockIndex++} className="text-sm text-[#666] leading-relaxed my-1">
        {line}
      </p>
    )
    i++
  }

  return <>{blocks}</>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ExportPreview({ markdown, title, onBack }: ExportPreviewProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle')

  function handleCopy() {
    // Use .then() (not async/await) to preserve user gesture context
    navigator.clipboard.writeText(markdown).then(
      () => {
        setCopyState('copied')
        setTimeout(() => setCopyState('idle'), 3000)
      },
      () => {
        setCopyState('error')
        setTimeout(() => setCopyState('idle'), 3000)
      }
    )
  }

  function handleDownload() {
    const filename = `${slugifyTitle(title)}-export.md`
    const blob = new Blob([markdown], { type: 'text/markdown; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const sections = parseExportSections(markdown)

  // Extract metadata header (everything before first ## heading)
  const metaEnd = markdown.indexOf('## ')
  const metaBlock = metaEnd > 0 ? markdown.slice(0, metaEnd).trim() : ''
  // Parse metadata lines (lines starting with **)
  const metaLines = metaBlock.split('\n').filter(l => l.startsWith('**'))

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: Back button + label */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#444] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to brief
        </button>
        <p className="text-[10px] text-[#bbb] uppercase tracking-widest">Export Preview</p>
      </div>

      {/* Metadata header */}
      <div className="bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-4 py-3 mb-5">
        {metaLines.map((line, i) => {
          const match = line.match(/^\*\*(.+?):\*\*\s*(.+)$/)
          return match ? (
            <p key={i} className="text-[10px] text-[#999] leading-relaxed">
              <span className="text-[#bbb]">{match[1]}:</span> {match[2]}
            </p>
          ) : null
        })}
      </div>

      {/* Rendered sections */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {sections.map((section, i) => (
          <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
            <p className="text-[10px] text-[#bbb] uppercase tracking-widest mb-2.5">
              {section.heading}
            </p>
            {renderSectionBody(section.body)}
          </div>
        ))}
      </div>

      {/* Action buttons: Copy + Download */}
      <div className="pt-5 border-t border-[#e8e8ec] mt-5 flex gap-3">
        <button
          onClick={handleCopy}
          className={[
            'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all',
            copyState === 'copied'
              ? 'text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20'
              : copyState === 'error'
              ? 'text-red-400/70 bg-red-400/[0.06] border border-red-400/15'
              : 'text-[#555] bg-[#f5f5f7] border border-[#ddd] hover:text-[#222] hover:bg-[#e8e8ec] hover:border-[#aaa]',
          ].join(' ')}
        >
          {copyState === 'copied' ? (
            <><Check size={14} />Copied to clipboard</>
          ) : copyState === 'error' ? (
            <><AlertCircle size={14} />Copy failed</>
          ) : (
            <><Copy size={14} />Copy to Clipboard</>
          )}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-[#555] bg-[#f5f5f7] border border-[#ddd] hover:text-[#222] hover:bg-[#e8e8ec] hover:border-[#aaa] transition-all"
        >
          <Download size={14} />
          Download .md
        </button>
      </div>

      {/* Toast notification for clipboard copy */}
      {copyState === 'copied' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-white border border-emerald-400/20 rounded-lg px-4 py-2.5 shadow-xl">
            <p className="text-xs text-emerald-400">
              Copied to clipboard — paste into Cursor or Claude Code
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
