'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  FileSpreadsheet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Step = 1 | 2 | 3
type Role = 'Founder' | 'PM' | 'Engineer' | 'Other'
type SetupState = 'idle' | 'running' | 'done' | 'error'
type CsvState = 'idle' | 'parsed' | 'uploading' | 'done' | 'error'
type CsvRow = { [key: string]: string | undefined }

// ---------------------------------------------------------------------------
// CSV parser (same approach as sources page)
// ---------------------------------------------------------------------------
function parseRow(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1)
    .map(line => {
      const values = parseRow(line)
      const row: CsvRow = {}
      headers.forEach((h, i) => { row[h] = values[i] ?? '' })
      return row
    })
    .filter(row => Object.values(row).some(v => v?.trim()))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-[7px] h-[7px] bg-white rotate-45 shrink-0" />
      <span
        style={{ fontFamily: 'var(--font-syne)', letterSpacing: '0.22em' }}
        className="text-[11px] font-extrabold text-white uppercase"
      >
        Sightline
      </span>
    </div>
  )
}

function StepDots({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2, 3] as Step[]).map(n => (
        <div
          key={n}
          className={[
            'rounded-full transition-all duration-300',
            n === current
              ? 'w-5 h-1.5 bg-white'
              : n < current
              ? 'w-1.5 h-1.5 bg-white/40'
              : 'w-1.5 h-1.5 bg-white/[0.12]',
          ].join(' ')}
        />
      ))}
      <span className="text-[11px] text-white/25 ml-2">
        Step {current} of 3
      </span>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.2] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-colors"
      />
    </div>
  )
}

function Textarea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-xs text-white/40">{label}</label>
        {hint && <span className="text-[10px] text-white/20">{hint}</span>}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.2] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-colors resize-none leading-relaxed"
      />
    </div>
  )
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2 bg-white text-[#09090e] rounded-lg py-2.5 px-4 text-sm font-semibold hover:bg-white/90 active:bg-white/80 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  )
}

// Coming-soon source card
function ComingSoonCard({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3 opacity-50">
      <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-white/50">{label}</p>
        <p className="text-[10px] text-white/20 mt-0.5">Coming soon</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OnboardPage() {
  const router = useRouter()

  // ── Redirect if already onboarded ─────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) router.replace('/dashboard')
        })
    })
  }, [router])

  // ── Step 1 state ───────────────────────────────────────────────────────────
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')

  // ── Step 2 state ───────────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState<Role>('Founder')
  const [setupState, setSetupState] = useState<SetupState>('idle')
  const [setupError, setSetupError] = useState('')

  // ── Step navigation ────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1)

  // ── Step 3 CSV state ───────────────────────────────────────────────────────
  const [csvState, setCsvState] = useState<CsvState>('idle')
  const [csvRows, setCsvRows] = useState<CsvRow[]>([])
  const [csvError, setCsvError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleStep1Continue() {
    if (!productName.trim()) return
    setStep(2)
  }

  async function handleStep2Continue() {
    if (!companyName.trim() || setupState === 'running') return
    setSetupState('running')
    setSetupError('')

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, productName, productDescription, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Setup failed')
      setSetupState('done')
      setStep(3)
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'Something went wrong')
      setSetupState('error')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCsv(ev.target?.result as string)
      if (rows.length === 0) {
        setCsvError('No rows found. Check your CSV has headers and at least one data row.')
        return
      }
      setCsvRows(rows)
      setCsvState('parsed')
      setCsvError('')
    }
    reader.readAsText(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  async function handleCsvUpload() {
    if (csvRows.length === 0 || csvState === 'uploading') return
    setCsvState('uploading')
    try {
      const res = await fetch('/api/sources/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: csvRows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setCsvState('done')
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'Upload failed')
      setCsvState('error')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090e] flex flex-col items-center justify-center p-6">

      {/* Wordmark */}
      <div className="mb-10">
        <Wordmark />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#0d0d15] border border-white/[0.07] rounded-2xl p-8 shadow-2xl shadow-black/50">

        <StepDots current={step} />

        {/* ── Step 1: Your product ─────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-xl font-bold text-white mb-1.5"
            >
              What are you building?
            </h1>
            <p className="text-sm text-white/35 mb-7 leading-relaxed">
              This becomes your workspace and helps Sightline ground answers in your product context.
            </p>

            <div className="space-y-4">
              <Input
                label="Product name"
                value={productName}
                onChange={setProductName}
                placeholder="e.g. Acme Analytics"
                autoFocus
              />
              <Textarea
                label="What does it do?"
                hint="optional"
                value={productDescription}
                onChange={setProductDescription}
                placeholder="One or two sentences about who it's for and the core problem it solves."
                rows={3}
              />
            </div>

            <div className="mt-7">
              <PrimaryButton
                onClick={handleStep1Continue}
                disabled={!productName.trim()}
              >
                Continue <ArrowRight size={13} />
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* ── Step 2: Your team ─────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h1
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-xl font-bold text-white mb-1.5"
            >
              Tell us about your team
            </h1>
            <p className="text-sm text-white/35 mb-7 leading-relaxed">
              Sets up your organisation so you can invite teammates later.
            </p>

            <div className="space-y-4">
              <Input
                label="Company name"
                value={companyName}
                onChange={setCompanyName}
                placeholder="e.g. Acme Inc."
                autoFocus
              />

              <div>
                <label className="block text-xs text-white/40 mb-2">Your role</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Founder', 'PM', 'Engineer', 'Other'] as Role[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={[
                        'py-2 rounded-lg text-xs font-medium transition-all border',
                        role === r
                          ? 'bg-white text-[#09090e] border-transparent'
                          : 'bg-white/[0.03] text-white/45 border-white/[0.08] hover:border-white/[0.15] hover:text-white/65',
                      ].join(' ')}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {setupState === 'error' && (
              <div className="flex items-center gap-2 text-red-400/70 text-xs mt-4">
                <AlertCircle size={13} className="shrink-0" />
                {setupError}
              </div>
            )}

            <div className="flex gap-2.5 mt-7">
              <button
                onClick={() => setStep(1)}
                className="flex-shrink-0 px-4 py-2.5 rounded-lg text-sm text-white/35 hover:text-white/60 border border-white/[0.07] hover:border-white/[0.14] transition-all"
              >
                Back
              </button>
              <div className="flex-1">
                <PrimaryButton
                  onClick={handleStep2Continue}
                  disabled={!companyName.trim()}
                  loading={setupState === 'running'}
                >
                  {setupState === 'running' ? null : <>Continue <ArrowRight size={13} /></>}
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Connect a source ──────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h1
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-xl font-bold text-white mb-1.5"
            >
              Connect your first source
            </h1>
            <p className="text-sm text-white/35 mb-7 leading-relaxed">
              Upload a CSV of customer signals to start analysing. You can add more later.
            </p>

            {/* CSV upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {csvState === 'idle' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/[0.1] hover:border-white/[0.2] rounded-xl p-7 flex flex-col items-center gap-3 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] group-hover:bg-white/[0.08] flex items-center justify-center transition-colors">
                  <Upload size={18} className="text-white/30" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/50 font-medium">Upload a CSV</p>
                  <p className="text-xs text-white/25 mt-0.5">
                    Columns: date, customer_name, source_type, content
                  </p>
                </div>
              </button>
            )}

            {csvState === 'parsed' && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet size={15} className="text-white/40" />
                    <span className="text-sm text-white/60 font-medium">
                      {csvRows.length} row{csvRows.length !== 1 ? 's' : ''} ready
                    </span>
                  </div>
                  <button
                    onClick={() => { setCsvState('idle'); setCsvRows([]) }}
                    className="text-[10px] text-white/25 hover:text-white/50 transition-colors"
                  >
                    Change file
                  </button>
                </div>
                <button
                  onClick={handleCsvUpload}
                  className="w-full flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.13] border border-white/[0.1] text-white/70 rounded-lg py-2 text-sm font-medium transition-all"
                >
                  <Upload size={13} />
                  Upload {csvRows.length} signals
                </button>
              </div>
            )}

            {csvState === 'uploading' && (
              <div className="w-full border-2 border-dashed border-white/[0.08] rounded-xl p-7 flex flex-col items-center gap-3">
                <Loader2 size={20} className="text-white/30 animate-spin" />
                <p className="text-sm text-white/40">Uploading signals…</p>
              </div>
            )}

            {csvState === 'done' && (
              <div className="bg-emerald-400/[0.05] border border-emerald-400/20 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm text-emerald-400 font-medium">
                    {csvRows.length} signals uploaded
                  </p>
                  <p className="text-xs text-emerald-400/50 mt-0.5">
                    Head to Query to start analysing your data
                  </p>
                </div>
              </div>
            )}

            {csvState === 'error' && (
              <div className="space-y-3">
                <div className="bg-red-400/[0.05] border border-red-400/20 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle size={15} className="text-red-400/70 shrink-0" />
                  <p className="text-xs text-red-400/70 leading-relaxed">{csvError}</p>
                </div>
                <button
                  onClick={() => { setCsvState('idle'); setCsvRows([]); setCsvError('') }}
                  className="text-xs text-white/30 hover:text-white/55 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {csvError && csvState === 'idle' && (
              <p className="text-xs text-red-400/60 mt-2">{csvError}</p>
            )}

            {/* Coming soon sources */}
            <div className="mt-5 space-y-2">
              <p className="text-[10px] text-white/20 uppercase tracking-wider mb-3">
                More sources
              </p>
              <ComingSoonCard
                label="Gong"
                icon={<span className="text-[10px] font-bold text-white/30">G</span>}
              />
              <ComingSoonCard
                label="Zoom"
                icon={<span className="text-[10px] font-bold text-white/30">Z</span>}
              />
              <ComingSoonCard
                label="Intercom"
                icon={<span className="text-[10px] font-bold text-white/30">I</span>}
              />
            </div>

            {/* Go to dashboard */}
            <div className="mt-7">
              <PrimaryButton onClick={() => router.push('/dashboard')}>
                {csvState === 'done' ? (
                  <>Go to Dashboard <ArrowRight size={13} /></>
                ) : (
                  <>Skip for now <ArrowRight size={13} /></>
                )}
              </PrimaryButton>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <p className="text-[11px] text-white/15 mt-8">
        Your data stays in your workspace. No sharing.
      </p>

    </div>
  )
}
