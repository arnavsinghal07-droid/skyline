'use client'

interface ShimmerLoaderProps {
  lines?: number
  className?: string
}

export function ShimmerLoader({ lines = 3, className }: ShimmerLoaderProps) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="relative mb-3 last:mb-0 h-4 overflow-hidden rounded-md bg-black/[0.03]"
          style={{ width: `${90 - i * 15}%` }}
        >
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-black/[0.04] to-transparent"
          />
        </div>
      ))}
    </div>
  )
}
