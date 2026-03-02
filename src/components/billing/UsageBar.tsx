'use client'

type UsageBarProps = {
  used: number
  limit: number | null  // null means unlimited (Pro plan)
  plan: string
}

export function UsageBar({ used, limit, plan }: UsageBarProps) {
  if (plan === 'pro' || limit === null) {
    return (
      <div className="bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-[#777]">Brief usage this period</p>
          <p className="text-xs text-[#444] font-medium">{used} briefs generated</p>
        </div>
        <p className="text-[10px] text-[#bbb]">Unlimited — Pro plan</p>
      </div>
    )
  }

  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const remaining = Math.max(limit - used, 0)
  const isAtLimit = used >= limit

  return (
    <div className="bg-[#fafafa] border border-[#e8e8ec] rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#777]">Brief usage this period</p>
        <p className={`text-xs font-medium ${isAtLimit ? 'text-amber-400' : 'text-[#444]'}`}>
          {used}/{limit} briefs used
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#f0f0f3] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isAtLimit ? 'bg-amber-400' : percentage > 70 ? 'bg-amber-400/70' : 'bg-[#ccc]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className={`text-[10px] mt-1.5 ${isAtLimit ? 'text-amber-400/60' : 'text-[#bbb]'}`}>
        {isAtLimit
          ? `All ${limit} briefs used this month`
          : `${remaining} brief${remaining !== 1 ? 's' : ''} remaining`}
      </p>
    </div>
  )
}
