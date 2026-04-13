/**
 * Formats a timestamp as a human-readable relative string.
 *
 * Short units (1m, 4h, 2d, 3w) are used for recency to keep the UI compact.
 * After 30 days the full locale date is shown since relative strings become
 * unhelpful at that scale.
 *
 * @param {string|Date} dateStr
 * @returns {string} e.g. "now", "42m", "3h", "2d", "1w" or "Apr 1, 2025"
 */
export function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now     = new Date();
  const date    = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60)  return 'now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)  return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24)    return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7)      return `${days}d`;
  if (days < 30)     return `${Math.floor(days / 7)}w`;

  return date.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

/**
 * Formats a timestamp as a full, localised datetime string.
 * Used for tooltip titles so users can see the exact posting time on hover.
 *
 * @param {string|Date} dateStr
 * @returns {string} e.g. "April 11, 2025 at 09:30 AM"
 */
export function formatFullDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
