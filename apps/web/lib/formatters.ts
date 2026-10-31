import Decimal from 'decimal.js';

export function formatMoney(
  amount: string | number | Decimal,
  currency = 'INR',
): string {
  try {
    const dec = new Decimal(amount || '0');
    const formattedNum = dec.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const symbolMap: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
    };
    const symbol = symbolMap[currency.toUpperCase()] || `${currency.toUpperCase()} `;
    return `${symbol}${formattedNum}`;
  } catch {
    return `${currency} 0.00`;
  }
}

export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString?: string | Date | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
