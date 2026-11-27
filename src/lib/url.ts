/**
 * Validates that a URL is an external http: or https: URL to block javascript: / data: / vbscript: injection.
 */
export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getSafeExternalHref(
  url: string | null | undefined,
  fallback = 'https://www.gov.kr'
): string {
  return isSafeHttpUrl(url) ? url!.trim() : fallback;
}
