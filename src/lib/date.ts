export interface DdayInfo {
  daysRemaining: number | null;
  label: string;
  isUrgent: boolean;
  isToday: boolean;
  isExpired: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns UTC midnight timestamp (00:00:00.000 UTC) for the given Date.
 */
export function getUtcTodayMidnight(now: Date = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Parses YYYY-MM-DD (or YYYYMMDD) strictly into UTC midnight timestamp (00:00:00.000 UTC).
 */
export function parseUtcMidnight(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(cleaned);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return Date.UTC(year, month - 1, day);
    }
  }

  const compactMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(cleaned);
  if (compactMatch) {
    const year = Number(compactMatch[1]);
    const month = Number(compactMatch[2]);
    const day = Number(compactMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return Date.UTC(year, month - 1, day);
    }
  }

  return null;
}

/**
 * Computes D-Day strictly using UTC 00:00:00 midnight comparison to prevent timezone drift.
 * Highlight threshold: 0 <= D <= 7 -> isUrgent = true ("오늘 마감" or "D-N").
 */
export function getDdayInfo(
  deadlineIso: string | null | undefined,
  now: Date = new Date()
): DdayInfo {
  const deadlineUtc = parseUtcMidnight(deadlineIso);
  if (deadlineUtc === null) {
    return {
      daysRemaining: null,
      label: '상시 신청',
      isUrgent: false,
      isToday: false,
      isExpired: false,
    };
  }

  const todayUtc = getUtcTodayMidnight(now);
  const diffDays = Math.round((deadlineUtc - todayUtc) / MS_PER_DAY);

  if (diffDays < 0) {
    return {
      daysRemaining: diffDays,
      label: '접수 마감',
      isUrgent: false,
      isToday: false,
      isExpired: true,
    };
  }

  if (diffDays === 0) {
    return {
      daysRemaining: 0,
      label: '오늘 마감',
      isUrgent: true,
      isToday: true,
      isExpired: false,
    };
  }

  return {
    daysRemaining: diffDays,
    label: `D-${diffDays}`,
    isUrgent: diffDays <= 7,
    isToday: false,
    isExpired: false,
  };
}

/**
 * Produces YYYY-MM-DD offset by N days from current UTC midnight.
 */
export function addUtcDaysIso(daysFromToday: number, now: Date = new Date()): string {
  const targetMs = getUtcTodayMidnight(now) + daysFromToday * MS_PER_DAY;
  const d = new Date(targetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatKoreanDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '상시';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  return `${match[1]}.${match[2]}.${match[3]}`;
}
