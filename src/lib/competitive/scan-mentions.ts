import type { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 100

interface ScanResult {
  mentionCount: number
  chunksScanned: number
}

/**
 * Scan all existing chunks for mentions of a competitor name.
 * Uses simple case-insensitive string matching (fast and cheap).
 * Updates chunk tags with competitor_mentions array.
 * Updates the competitor row's mention_count.
 */
export async function scanForCompetitorMentions(
  supabase: SupabaseClient,
  orgId: string,
  competitorId: string,
  competitorName: string
): Promise<ScanResult> {
  console.log(`[Sightline] Scanning chunks for mentions of "${competitorName}"...`)

  let offset = 0
  let mentionCount = 0
  let chunksScanned = 0
  const nameLower = competitorName.toLowerCase()

  while (true) {
    const { data: chunks, error } = await supabase
      .from('chunks')
      .select('id, text, tags')
      .eq('org_id', orgId)
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('[Sightline] Error fetching chunks:', error.message)
      break
    }

    if (!chunks || chunks.length === 0) break

    chunksScanned += chunks.length

    for (const chunk of chunks) {
      const text: string = chunk.text ?? ''
      if (text.toLowerCase().includes(nameLower)) {
        const tags = (chunk.tags as Record<string, unknown>) ?? {}
        const existingMentions: string[] = (tags.competitor_mentions as string[]) ?? []

        if (!existingMentions.includes(competitorId)) {
          await supabase
            .from('chunks')
            .update({
              tags: {
                ...tags,
                competitor_mentions: [...existingMentions, competitorId],
              },
            })
            .eq('id', chunk.id)
        }

        mentionCount++
      }
    }

    offset += PAGE_SIZE
    if (chunks.length < PAGE_SIZE) break
  }

  // Update competitor mention_count
  await supabase
    .from('competitors')
    .update({ mention_count: mentionCount })
    .eq('id', competitorId)

  console.log(`[Sightline] Found ${mentionCount} mentions of "${competitorName}" in ${chunksScanned} chunks`)
  return { mentionCount, chunksScanned }
}
