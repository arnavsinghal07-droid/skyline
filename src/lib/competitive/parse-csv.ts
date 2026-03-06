import Papa from 'papaparse'

export interface ParsedReview {
  reviewText: string
  reviewSourceId: string
  source: 'g2' | 'capterra'
  reviewerRole?: string
  companySize?: string
  reviewDate?: string
}

/**
 * Detect whether a CSV is from G2 or Capterra based on column headers.
 */
export function detectCsvSource(headers: string[]): 'g2' | 'capterra' | 'unknown' {
  const normalized = headers.map((h) => h.trim())
  if (normalized.includes('Pros') && normalized.includes('Cons')) return 'capterra'
  if (normalized.includes('Review') || normalized.includes('What do you like best?')) return 'g2'
  return 'unknown'
}

/**
 * Normalize a CSV row into a single review text string.
 */
function normalizeCsvRow(row: Record<string, string>, source: 'g2' | 'capterra'): string {
  if (source === 'g2') {
    const parts = [
      row['Review'] ?? '',
      row['What do you like best?'] ?? '',
      row['What do you dislike?'] ?? '',
      row['What problems is the product solving and how is that benefiting you?'] ?? '',
    ]
    return parts.filter(Boolean).join('\n\n')
  } else {
    const parts = [
      row['Pros'] ?? '',
      row['Cons'] ?? '',
      row['Overall Comments'] ?? '',
    ]
    return parts.filter(Boolean).join('\n\n')
  }
}

/**
 * Generate a simple hash from text for use as a review source ID.
 */
function hashText(text: string): string {
  let hash = 0
  const str = text.slice(0, 100)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

/**
 * Parse a G2 or Capterra CSV and return normalized reviews.
 * Throws if the CSV format is unrecognized.
 */
export function parseCsvReviews(csvText: string): ParsedReview[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
    throw new Error('CSV file appears to be empty or has no headers.')
  }

  const source = detectCsvSource(parsed.meta.fields)
  if (source === 'unknown') {
    throw new Error('Unrecognized CSV format. Please upload a G2 or Capterra review export.')
  }

  const reviews: ParsedReview[] = []

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i]
    const reviewText = normalizeCsvRow(row, source)

    if (!reviewText || reviewText.trim().length === 0) continue

    const reviewSourceId = `csv-${source}-${i}-${hashText(reviewText)}`

    const review: ParsedReview = {
      reviewText,
      reviewSourceId,
      source,
    }

    if (source === 'g2') {
      review.reviewerRole = row['Reviewer Title'] || undefined
      review.companySize = row['Reviewer Company Size'] || undefined
      review.reviewDate = row['Review Date'] || undefined
    } else {
      review.reviewerRole = row['Title'] || undefined
      review.companySize = row['Company Size'] || undefined
      review.reviewDate = row['Date'] || undefined
    }

    reviews.push(review)
  }

  return reviews
}
