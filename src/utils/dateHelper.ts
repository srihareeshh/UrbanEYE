/**
 * Standardized Date and Time Helper for UrbanEye / Alcheminds
 * Formats all timestamps in Indian Standard Time (IST / Asia/Kolkata / UTC+05:30)
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats date string into full IST DateTime string: e.g. "1 Sep 2026, 4:11 PM IST"
 */
export function formatISTDateTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return 'Time unavailable';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid date';

    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const formatted = formatter.format(date);
    return `${formatted} IST`;
  } catch (err) {
    return String(dateInput);
  }
}

/**
 * Formats date string into concise IST Date: e.g. "1 Sep 2026"
 */
export function formatISTDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch (err) {
    return '';
  }
}

/**
 * Formats date string into concise IST Time: e.g. "4:11 PM"
 */
export function formatISTTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (err) {
    return '';
  }
}

/**
 * Formats relative time with IST fallback
 */
export function formatRelativeTimeIST(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';

  try {
    const date = new Date(dateInput);
    const now = Date.now();
    const diffMs = now - date.getTime();

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return `Yesterday at ${formatISTTime(date)}`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatISTDateTime(date);
  } catch (err) {
    return '';
  }
}
