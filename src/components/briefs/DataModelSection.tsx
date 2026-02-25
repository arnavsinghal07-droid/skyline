'use client'

import type { ReactNode } from 'react'
import type { DataModelHint } from '@/app/api/briefs/generate/route'

// ---------------------------------------------------------------------------
// DDL Syntax Highlighting
// ---------------------------------------------------------------------------

const SQL_KEYWORDS = /\b(CREATE|TABLE|INDEX|ALTER|ADD|COLUMN|NOT\s+NULL|PRIMARY\s+KEY|DEFAULT|REFERENCES|ON\s+DELETE\s+CASCADE|UNIQUE|CHECK|DROP|IF\s+NOT\s+EXISTS|IF\s+EXISTS)\b/gi
const SQL_TYPES = /\b(UUID|TEXT|JSONB|TIMESTAMPTZ|INTEGER|NUMERIC|BOOLEAN|DATE|SERIAL|BIGINT|VARCHAR)\b/g
const SQL_FUNCTIONS = /\b(gen_random_uuid\(\)|now\(\)|auth\.uid\(\))/g

function highlightDDL(ddl: string): ReactNode[] {
  const lines = ddl.split('\n')
  const result: ReactNode[] = []

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      result.push('\n')
    }

    // Full-line comment
    const trimmed = line.trimStart()
    if (trimmed.startsWith('--')) {
      result.push(
        <span key={`line-${lineIdx}`} className="text-white/35 italic">
          {line}
        </span>
      )
      return
    }

    // For non-comment lines, tokenize by finding keywords, types, functions, and inline comments
    // We process the line as segments
    const segments: Array<{ text: string; type: 'keyword' | 'type' | 'function' | 'comment' | 'plain' }> = []

    // First, extract inline comment if any (-- to end of line)
    let codePart = line
    let commentPart: string | null = null
    const commentIdx = line.indexOf('--')
    if (commentIdx !== -1) {
      codePart = line.slice(0, commentIdx)
      commentPart = line.slice(commentIdx)
    }

    // Tokenize the code part using a combined pattern
    // We build a list of token boundaries
    type TokenType = 'keyword' | 'type' | 'function' | 'plain'
    const tokens: Array<{ text: string; type: TokenType }> = []

    // Build a combined pattern that captures all token types with named groups
    // We'll use a manual pass approach instead
    let remaining = codePart
    let pos = 0

    // Reset regex lastIndex
    const keywordRegex = /\b(CREATE|TABLE|INDEX|ALTER|ADD|COLUMN|NOT NULL|PRIMARY KEY|DEFAULT|REFERENCES|ON DELETE CASCADE|UNIQUE|CHECK|DROP|IF NOT EXISTS|IF EXISTS)\b/gi
    const typeRegex = /\b(UUID|TEXT|JSONB|TIMESTAMPTZ|INTEGER|NUMERIC|BOOLEAN|DATE|SERIAL|BIGINT|VARCHAR)\b/g
    const funcRegex = /\b(gen_random_uuid\(\)|now\(\)|auth\.uid\(\))/g

    // Find all matches with their positions
    type Match = { start: number; end: number; text: string; type: TokenType }
    const matches: Match[] = []

    let m: RegExpExecArray | null

    keywordRegex.lastIndex = 0
    while ((m = keywordRegex.exec(codePart)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], type: 'keyword' })
    }

    typeRegex.lastIndex = 0
    while ((m = typeRegex.exec(codePart)) !== null) {
      // Skip if already covered by a keyword match
      const overlaps = matches.some(existing => m !== null && m.index >= existing.start && m.index < existing.end)
      if (!overlaps) {
        matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], type: 'type' })
      }
    }

    funcRegex.lastIndex = 0
    while ((m = funcRegex.exec(codePart)) !== null) {
      const overlaps = matches.some(existing => m !== null && m.index >= existing.start && m.index < existing.end)
      if (!overlaps) {
        matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], type: 'function' })
      }
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start)

    // Remove overlapping matches (keep first)
    const nonOverlapping: Match[] = []
    for (const match of matches) {
      const last = nonOverlapping[nonOverlapping.length - 1]
      if (!last || match.start >= last.end) {
        nonOverlapping.push(match)
      }
    }

    // Build token array from plain text + matched tokens
    let cursor = 0
    for (const match of nonOverlapping) {
      if (match.start > cursor) {
        tokens.push({ text: codePart.slice(cursor, match.start), type: 'plain' })
      }
      tokens.push({ text: match.text, type: match.type })
      cursor = match.end
    }
    if (cursor < codePart.length) {
      tokens.push({ text: codePart.slice(cursor), type: 'plain' })
    }

    // Render tokens
    const rendered: ReactNode[] = tokens.map((tok, tokIdx) => {
      const key = `line-${lineIdx}-tok-${tokIdx}`
      if (tok.type === 'keyword') {
        return <span key={key} className="text-blue-400 font-medium">{tok.text}</span>
      } else if (tok.type === 'type') {
        return <span key={key} className="text-amber-300">{tok.text}</span>
      } else if (tok.type === 'function') {
        return <span key={key} className="text-purple-400">{tok.text}</span>
      } else {
        return <span key={key} className="text-white/60">{tok.text}</span>
      }
    })

    if (commentPart) {
      rendered.push(
        <span key={`line-${lineIdx}-comment`} className="text-white/35 italic">
          {commentPart}
        </span>
      )
    }

    result.push(...rendered)
  })

  return result
}

// ---------------------------------------------------------------------------
// DataModelSection — main export
// ---------------------------------------------------------------------------
interface DataModelSectionProps {
  hints: DataModelHint[]
}

export function DataModelSection({ hints }: DataModelSectionProps) {
  return (
    <div className="space-y-3">
      {hints.map((hint, i) => {
        const normalizedDDL = hint.ddl.replace(/\\n/g, '\n')
        const highlighted = highlightDDL(normalizedDDL)

        return (
          <div
            key={i}
            className="bg-[#0a0a12] border border-white/[0.06] rounded-lg overflow-hidden"
          >
            <p className="text-xs font-medium text-white/60 px-4 py-2.5 border-b border-white/[0.04]">
              {hint.feature_group}
            </p>
            <pre className="px-4 py-3 overflow-x-auto text-xs leading-relaxed bg-transparent">
              <code>{highlighted}</code>
            </pre>
          </div>
        )
      })}
    </div>
  )
}
