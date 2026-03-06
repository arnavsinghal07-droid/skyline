import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

export interface ScrapedReview {
  reviewText: string
  reviewSourceId: string
  reviewerRole?: string
  companySize?: string
  reviewDate?: string
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
    hash |= 0 // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Scrape G2 product reviews (first 2 pages).
 */
export async function scrapeG2Reviews(slug: string): Promise<ScrapedReview[]> {
  console.log(`[Sightline] Scraping G2 for ${slug}...`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const reviews: ScrapedReview[] = []

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })

    for (let pageNum = 1; pageNum <= 2; pageNum++) {
      const url = pageNum === 1
        ? `https://www.g2.com/products/${slug}/reviews`
        : `https://www.g2.com/products/${slug}/reviews?page=${pageNum}`

      console.log(`[Sightline] G2 page ${pageNum}: ${url}`)

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

      const pageReviews = await page.evaluate(() => {
        const reviewEls = document.querySelectorAll('[itemprop="review"], .review-content, [data-testid="review"]')
        const results: Array<{
          reviewText: string
          reviewerRole?: string
          companySize?: string
          reviewDate?: string
        }> = []

        reviewEls.forEach((el) => {
          const text = el.textContent?.trim()
          if (text && text.length > 50) {
            const roleEl = el.querySelector('[itemprop="author"], .reviewer-title, [data-testid="reviewer-title"]')
            const dateEl = el.querySelector('[itemprop="datePublished"], time, [data-testid="review-date"]')

            results.push({
              reviewText: text.slice(0, 5000),
              reviewerRole: roleEl?.textContent?.trim(),
              reviewDate: dateEl?.getAttribute('datetime') ?? dateEl?.textContent?.trim(),
            })
          }
        })

        return results
      })

      for (const r of pageReviews) {
        reviews.push({
          ...r,
          reviewSourceId: `g2-${slug}-${hashText(r.reviewText)}`,
        })
      }
    }
  } finally {
    await browser.close()
  }

  console.log(`[Sightline] G2 scraped ${reviews.length} reviews for ${slug}`)
  return reviews
}

/**
 * Scrape Capterra product reviews (first page).
 */
export async function scrapeCapterraReviews(
  slug: string,
  numericId: string
): Promise<ScrapedReview[]> {
  console.log(`[Sightline] Scraping Capterra for ${slug}...`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const reviews: ScrapedReview[] = []

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })

    const url = `https://www.capterra.com/p/${numericId}/${slug}/reviews/`
    console.log(`[Sightline] Capterra URL: ${url}`)

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    const pageReviews = await page.evaluate(() => {
      const reviewEls = document.querySelectorAll('[data-testid="review-card"], .review-card, .review-content')
      const results: Array<{
        reviewText: string
        reviewerRole?: string
        companySize?: string
        reviewDate?: string
      }> = []

      reviewEls.forEach((el) => {
        const text = el.textContent?.trim()
        if (text && text.length > 50) {
          const roleEl = el.querySelector('.reviewer-title, [data-testid="reviewer-title"]')
          const sizeEl = el.querySelector('.company-size, [data-testid="company-size"]')
          const dateEl = el.querySelector('time, [data-testid="review-date"]')

          results.push({
            reviewText: text.slice(0, 5000),
            reviewerRole: roleEl?.textContent?.trim(),
            companySize: sizeEl?.textContent?.trim(),
            reviewDate: dateEl?.getAttribute('datetime') ?? dateEl?.textContent?.trim(),
          })
        }
      })

      return results
    })

    for (const r of pageReviews) {
      reviews.push({
        ...r,
        reviewSourceId: `capterra-${slug}-${hashText(r.reviewText)}`,
      })
    }
  } finally {
    await browser.close()
  }

  console.log(`[Sightline] Capterra scraped ${reviews.length} reviews for ${slug}`)
  return reviews
}
