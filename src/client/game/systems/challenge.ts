/**
 * Challenge URL parsing + share helpers.
 *
 * Reddit/Devvit constraint: we can't post directly from the webview, but we
 * can use navigator.share / clipboard fallback + URL params (?challenge=N)
 * to drive the K-factor "beat my score" loop.
 */

const CHALLENGE_PARAM = 'challenge'

export function parseChallengeFromUrl(): number | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get(CHALLENGE_PARAM)
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

export function buildChallengeUrl(score: number): string {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set(CHALLENGE_PARAM, String(score))
    return url.toString()
  } catch {
    return `?${CHALLENGE_PARAM}=${score}`
  }
}

export type ShareResult = 'shared' | 'copied' | 'failed'

export async function shareScore(score: number, coins: number): Promise<ShareResult> {
  const text = `I scored ${score} in RunRun (${coins} coins). Can you beat me?`
  const url = buildChallengeUrl(score)

  // Native share API (best on mobile)
  try {
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>
    }
    if (typeof nav.share === 'function') {
      await nav.share({ title: 'RunRun', text, url })
      return 'shared'
    }
  } catch {
    // user dismissed share sheet — fall through to clipboard
  }

  // Clipboard fallback
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      return 'copied'
    }
  } catch {
    // ignore
  }

  return 'failed'
}
