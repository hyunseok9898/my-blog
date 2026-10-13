import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatPostDate(date: string | Date) {
  return format(new Date(date), 'PPP', { locale: ko });
}
