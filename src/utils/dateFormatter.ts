/**
 * Formats a timestamp into strict "DD MMM YYYY" format (e.g. "02 Nov 2026").
 * No relative terms ("hari ini"), no hours, no minutes.
 */
export function formatDate(timestamp?: number): string {
  if (!timestamp) return '02 Nov 2026';
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[date.getMonth()] || 'Nov';
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
