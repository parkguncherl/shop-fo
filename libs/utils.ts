import 'dayjs/locale/ko';

const currency = new Intl.NumberFormat('ko-KR');

export const Utils = {
  /** YYYY. MM. DD */
  formatDate(value?: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.slice(0, 10);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  },

  /** YYYY. MM. DD HH:mm */
  formatDateTime(value?: string | null): string {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.replace('T', ' ').slice(0, 16);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  },

  /** MM. DD HH:mm */
  formatMonthDayTime(value?: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  },

  /** 숫자 → "1,234원" */
  formatWon(value?: number | null): string {
    return `${currency.format(value ?? 0)}원`;
  },
};
