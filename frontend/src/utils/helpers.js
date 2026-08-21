/**
 * Format amount from smallest currency unit (cents/sen) to readable string.
 * Example: 15000000 → "Rp 150.000"
 */
export function formatCurrency(amount) {
  const value = Math.abs(amount) / 100;
  return 'Rp ' + value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format date for display.
 * Example: "2026-08-20T10:30:00" → "20 Aug 2026"
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date for input fields.
 * Example: "2026-08-20T10:30:00" → "2026-08-20"
 */
export function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Get wallet type label and emoji.
 */
export function getWalletTypeInfo(type) {
  const types = {
    bank:    { label: 'Bank',     emoji: '🏦' },
    ewallet: { label: 'E-Wallet', emoji: '📱' },
    cash:    { label: 'Cash',     emoji: '💵' },
  };
  return types[type] || { label: type, emoji: '💰' };
}

/**
 * Get today's date in YYYY-MM-DD format for input defaults.
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}
